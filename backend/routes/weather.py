"""
Weather endpoint — uses Open-Meteo (FREE, no API key) + real reverse geocoding.
Falls back to OpenWeatherMap if OPENWEATHER_API_KEY is configured.
NEVER returns hardcoded Guntur data — always real weather for the given coordinates.
"""
import os
import logging
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, Query

log = logging.getLogger("krishirakshak.weather")
router = APIRouter()

OWM_KEY = os.environ.get("OPENWEATHER_API_KEY", "").strip()


def _farming_advice(temp: float, humidity: float, wind: float, rain_chance: float) -> dict:
    spray_ok      = temp < 35 and wind < 20 and humidity < 85 and rain_chance < 40
    irrigation_ok = rain_chance > 50
    harvest_ok    = humidity < 70 and rain_chance < 30

    if humidity > 80 and temp > 25:   risk = "VERY_HIGH"
    elif humidity > 70 and temp > 20: risk = "HIGH"
    elif humidity > 60:               risk = "MODERATE"
    else:                             risk = "LOW"

    risk_reasons = {
        "VERY_HIGH": f"Humidity {humidity:.0f}% + {temp:.0f}°C = critical fungal disease conditions. Apply preventive fungicide immediately.",
        "HIGH":      f"Humidity {humidity:.0f}% + {temp:.0f}°C = elevated Late Blight / Blast risk. Monitor crops daily.",
        "MODERATE":  f"Moderate humidity {humidity:.0f}%. Monitor crops every 2-3 days.",
        "LOW":       f"Good weather conditions. Low disease risk today.",
    }
    return {
        "spray_window": {
            "ok": spray_ok,
            "reason": "Good spray window: 6–10 AM (low wind, no rain expected)." if spray_ok else (
                "Avoid spraying. " +
                ("Rain expected soon. " if rain_chance >= 40 else "") +
                ("Wind too high (>20 km/h). " if wind >= 20 else "") +
                ("Temperature too high (>35°C)." if temp >= 35 else "")
            ).strip(),
        },
        "irrigation": {
            "ok": irrigation_ok,
            "reason": "Skip irrigation — rain expected today." if irrigation_ok
                      else "Proceed with normal irrigation. No rain expected.",
        },
        "harvest": {
            "ok": harvest_ok,
            "reason": "Good conditions for harvesting." if harvest_ok
                      else "Delay harvest — high humidity or rain risk will damage harvested crop.",
        },
        "disease_risk":   risk,
        "disease_reason": risk_reasons[risk],
    }


def _wmo_condition(code: int) -> tuple[str, str]:
    """Map WMO weather interpretation code → (description, icon_key)."""
    if code == 0:                     return "Clear Sky", "sun"
    if code in (1, 2):                return "Partly Cloudy", "cloud"
    if code == 3:                     return "Overcast", "cloud"
    if code in (45, 48):              return "Foggy", "cloud"
    if code in (51, 53, 55):          return "Drizzle", "rain"
    if code in (61, 63, 65):          return "Rain", "rain"
    if code in (80, 81, 82):          return "Rain Showers", "rain"
    if code in (95, 96, 99):          return "Thunderstorm", "storm"
    if code in (71, 73, 75, 77, 85, 86): return "Snow", "snow"
    return "Cloudy", "cloud"


async def _reverse_geocode(lat: float, lon: float) -> str:
    """Get real city name from coordinates using OpenStreetMap Nominatim (free, no key)."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lon, "format": "json"},
                headers={"User-Agent": "KrishiRakshak-AI/2.0 (farming-app)"},
            )
            resp.raise_for_status()
            d = resp.json()
            addr = d.get("address", {})
            city  = (addr.get("city") or addr.get("town") or addr.get("village")
                     or addr.get("county") or addr.get("state_district") or "")
            state = addr.get("state", "")
            country = addr.get("country_code", "").upper()
            if city and state:
                return f"{city}, {state}"
            elif city:
                return f"{city}, {country}"
            return f"{lat:.3f}°N, {lon:.3f}°E"
    except Exception as e:
        log.debug("Reverse geocode failed: %s", e)
        return f"{lat:.3f}°N, {lon:.3f}°E"


async def _fetch_open_meteo(lat: float, lon: float) -> dict:
    """
    Fetch real weather from Open-Meteo API — completely free, no API key needed.
    Returns current weather + hourly (6 slots) + 7-day daily forecast.
    """
    city = await _reverse_geocode(lat, lon)

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": [
            "temperature_2m", "relative_humidity_2m", "apparent_temperature",
            "weather_code", "wind_speed_10m", "surface_pressure",
            "visibility", "dew_point_2m", "precipitation_probability",
        ],
        "hourly": ["temperature_2m", "precipitation_probability", "weather_code"],
        "daily": [
            "weather_code", "temperature_2m_max", "temperature_2m_min",
            "precipitation_probability_max",
        ],
        "timezone": "auto",
        "forecast_days": 7,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
        resp.raise_for_status()
        d = resp.json()

    cur        = d["current"]
    temp       = round(cur["temperature_2m"], 1)
    feels_like = round(cur["apparent_temperature"], 1)
    humidity   = int(cur["relative_humidity_2m"])
    wind       = round(cur["wind_speed_10m"], 1)
    pressure   = int(cur.get("surface_pressure", 1013))
    dew_point  = round(cur.get("dew_point_2m", temp - 5), 1)
    rain_chance= int(cur.get("precipitation_probability") or 0)
    visibility = round(cur.get("visibility", 10000) / 1000, 1)
    wmo_code   = int(cur.get("weather_code", 0))
    condition, _ = _wmo_condition(wmo_code)
    uv_index   = max(1, min(11, int((temp - 10) / 3))) if temp > 10 else 1

    # Hourly — 6 fixed time slots for today
    h_times = d["hourly"]["time"]
    h_temps = d["hourly"]["temperature_2m"]
    h_rain  = d["hourly"]["precipitation_probability"]
    h_codes = d["hourly"]["weather_code"]
    today   = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    hourly = []
    for label, hr in [("6 AM", 6), ("9 AM", 9), ("12 PM", 12), ("3 PM", 15), ("6 PM", 18), ("9 PM", 21)]:
        target = f"{today}T{hr:02d}:00"
        try:
            idx = h_times.index(target)
            _, icon = _wmo_condition(int(h_codes[idx] or 0))
            hourly.append({
                "time": label,
                "temp": round(h_temps[idx]),
                "rain": int(h_rain[idx] or 0),
                "icon": icon,
            })
        except ValueError:
            pass  # time slot not available

    # Daily — 7 days
    d_dates = d["daily"]["time"]
    d_codes = d["daily"]["weather_code"]
    d_max   = d["daily"]["temperature_2m_max"]
    d_min   = d["daily"]["temperature_2m_min"]
    d_rain  = d["daily"]["precipitation_probability_max"]

    DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly = []
    for i in range(min(7, len(d_dates))):
        _, icon = _wmo_condition(int(d_codes[i] or 0))
        dt = datetime.strptime(d_dates[i], "%Y-%m-%d")
        label = "Today" if i == 0 else DAYS[dt.weekday()]
        weekly.append({
            "day": label, "high": round(d_max[i]), "low": round(d_min[i]),
            "rain": int(d_rain[i] or 0), "icon": icon,
        })

    return {
        "city": city, "lat": lat, "lon": lon,
        "temp": temp, "feels_like": feels_like,
        "humidity": humidity, "wind_speed": wind,
        "visibility": visibility, "condition": condition,
        "uv_index": uv_index, "pressure": pressure,
        "dew_point": dew_point, "rain_chance": rain_chance,
        "hourly": hourly, "weekly": weekly,
        "farming_advice": _farming_advice(temp, humidity, wind, rain_chance),
        "source": "open-meteo",
    }


async def _fetch_openweathermap(lat: float, lon: float) -> dict:
    """Fetch from OpenWeatherMap One Call 3.0 when API key available."""
    DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Reverse geocode for real city name
        try:
            geo = await client.get(
                "https://api.openweathermap.org/geo/1.0/reverse",
                params={"lat": lat, "lon": lon, "limit": 1, "appid": OWM_KEY}
            )
            geo.raise_for_status()
            geo_data = geo.json()
            if geo_data:
                city = f"{geo_data[0].get('name', '')}, {geo_data[0].get('state', '')}".strip(", ")
            else:
                city = await _reverse_geocode(lat, lon)
        except Exception:
            city = await _reverse_geocode(lat, lon)

        # Try One Call 3.0 first (has hourly + daily)
        try:
            oc = await client.get(
                "https://api.openweathermap.org/data/3.0/onecall",
                params={"lat": lat, "lon": lon, "appid": OWM_KEY, "units": "metric", "exclude": "minutely,alerts"}
            )
            oc.raise_for_status()
            data = oc.json()

            cur      = data["current"]
            temp     = round(cur["temp"], 1)
            feels    = round(cur["feels_like"], 1)
            humidity = cur["humidity"]
            wind     = round(cur["wind_speed"] * 3.6, 1)
            pressure = cur["pressure"]
            uv       = round(cur.get("uvi", 6), 1)
            vis      = round(cur.get("visibility", 10000) / 1000, 1)
            dew      = round(cur.get("dew_point", temp - 5), 1)
            condition= cur["weather"][0]["description"].title()
            rain_ch  = int(round((data["hourly"][0].get("pop", 0) if data.get("hourly") else 0) * 100))

            def _icon(oid):
                if oid.startswith(("09","10")): return "rain"
                if oid.startswith("11"): return "storm"
                if oid.startswith("13"): return "snow"
                if oid.startswith(("02","03","04")): return "cloud"
                return "sun"

            hourly = []
            for i, h in enumerate(data.get("hourly", [])[:18:3]):
                dt_label = datetime.fromtimestamp(h["dt"]).strftime("%-I %p")
                hourly.append({"time": dt_label, "temp": round(h["temp"], 1),
                               "rain": int(round(h.get("pop",0)*100)), "icon": _icon(h["weather"][0]["icon"])})

            weekly = []
            for i, day in enumerate(data.get("daily", [])[:7]):
                dt_obj = datetime.fromtimestamp(day["dt"])
                label = "Today" if i == 0 else DAYS[dt_obj.weekday()]
                weekly.append({"day": label, "high": round(day["temp"]["max"], 1),
                               "low": round(day["temp"]["min"], 1),
                               "rain": int(round(day.get("pop",0)*100)), "icon": _icon(day["weather"][0]["icon"])})

            return {
                "city": city, "lat": lat, "lon": lon,
                "temp": temp, "feels_like": feels, "humidity": humidity,
                "wind_speed": wind, "visibility": vis, "condition": condition,
                "uv_index": uv, "pressure": pressure, "dew_point": dew, "rain_chance": rain_ch,
                "hourly": hourly, "weekly": weekly,
                "farming_advice": _farming_advice(temp, humidity, wind, rain_ch),
                "source": "openweathermap-onecall",
            }
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (401, 403):
                log.warning("OWM One Call 3.0 requires paid subscription — falling back to Open-Meteo")
                raise RuntimeError("OWM One Call 3.0 unavailable")
            raise


@router.get("/weather")
async def get_weather(
    lat: float = Query(..., description="Latitude from browser GPS"),
    lon: float = Query(..., description="Longitude from browser GPS"),
):
    """
    Real weather for the given GPS coordinates.
    Never returns hardcoded Guntur data — always fetches live data for your location.
    """
    log.info("Weather: lat=%.4f lon=%.4f", lat, lon)

    # Try OpenWeatherMap One Call if key available
    if OWM_KEY:
        try:
            result = await _fetch_openweathermap(lat, lon)
            log.info("OWM weather: %s  %.1f°C", result["city"], result["temp"])
            return result
        except Exception as e:
            log.warning("OWM failed (%s) — using Open-Meteo", e)

    # Open-Meteo: free, no key, real global weather data
    try:
        result = await _fetch_open_meteo(lat, lon)
        log.info("Open-Meteo: %s  %.1f°C", result["city"], result["temp"])
        return result
    except Exception as e:
        log.error("Open-Meteo failed: %s", e)
        raise
