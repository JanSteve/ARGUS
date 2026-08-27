import React, { useState, useEffect, useCallback } from "react";
import styles from "./WeatherApp.module.css";

interface CityOption {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: number;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
}

interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
}

const DEFAULT_CITIES: CityOption[] = [
  { name: "San Francisco", country: "United States", latitude: 37.7749, longitude: -122.4194 },
  { name: "London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278 },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { name: "New York", country: "United States", latitude: 40.7128, longitude: -74.0060 },
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
  { name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708 },
  { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093 },
];

function getWeatherInfo(code: number): { label: string; icon: string } {
  switch (code) {
    case 0:
      return { label: "Clear Sky", icon: "☀️" };
    case 1:
      return { label: "Mainly Clear", icon: "🌤️" };
    case 2:
      return { label: "Partly Cloudy", icon: "⛅" };
    case 3:
      return { label: "Overcast", icon: "☁️" };
    case 45:
    case 48:
      return { label: "Foggy", icon: "🌫️" };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: "Drizzle", icon: "🌦️" };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return { label: "Rain", icon: "🌧️" };
    case 71:
    case 73:
    case 75:
    case 77:
      return { label: "Snow", icon: "❄️" };
    case 80:
    case 81:
    case 82:
      return { label: "Rain Showers", icon: "🌧️" };
    case 85:
    case 86:
      return { label: "Snow Showers", icon: "🌨️" };
    case 95:
    case 96:
    case 99:
      return { label: "Thunderstorm", icon: "⛈️" };
    default:
      return { label: "Fair", icon: "🌤️" };
  }
}

export const WeatherApp: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<CityOption>(() => {
    try {
      const saved = localStorage.getItem("argus-weather-city");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CITIES[0];
  });

  const [unit, setUnit] = useState<"C" | "F">("C");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [daily, setDaily] = useState<DailyForecast[]>([]);

  const convertTemp = useCallback((celsius: number) => {
    if (unit === "F") {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  }, [unit]);

  const fetchWeather = useCallback(async (city: CityOption) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      if (!res.ok) throw new Error("Failed to load weather");
      const data = await res.json();

      setCurrent({
        temperature: data.current.temperature_2m,
        apparentTemperature: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day,
      });

      // Format next 12 hours
      const nextHourly: HourlyForecast[] = [];
      const currentHourIndex = new Date().getHours();
      for (let i = currentHourIndex; i < currentHourIndex + 12 && i < data.hourly.time.length; i++) {
        const timeStr = data.hourly.time[i].split("T")[1];
        nextHourly.push({
          time: timeStr || `${i}:00`,
          temperature: data.hourly.temperature_2m[i],
          weatherCode: data.hourly.weather_code[i],
        });
      }
      setHourly(nextHourly);

      // Format 5 days
      const nextDaily: DailyForecast[] = [];
      for (let i = 0; i < Math.min(5, data.daily.time.length); i++) {
        const dateObj = new Date(data.daily.time[i]);
        const dayLabel = i === 0 ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: "short" });
        nextDaily.push({
          date: dayLabel,
          maxTemp: data.daily.temperature_2m_max[i],
          minTemp: data.daily.temperature_2m_min[i],
          weatherCode: data.daily.weather_code[i],
        });
      }
      setDaily(nextDaily);
    } catch (err) {
      console.error("[WeatherApp] Error fetching forecast:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedCity);
    try {
      localStorage.setItem("argus-weather-city", JSON.stringify(selectedCity));
    } catch {}
  }, [selectedCity, fetchWeather]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setSearchResults(
          data.results.map((r: any) => ({
            name: r.name,
            country: r.country || r.admin1 || "",
            latitude: r.latitude,
            longitude: r.longitude,
          }))
        );
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("[WeatherApp] Geocode error:", err);
    }
  };

  const handleSelectCity = (city: CityOption) => {
    setSelectedCity(city);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const weatherMeta = current ? getWeatherInfo(current.weatherCode) : { label: "Loading...", icon: "🌤️" };

  return (
    <div className={styles.weatherApp}>
      {/* Search Bar */}
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search city (e.g. Tokyo, Berlin, Sydney)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="button"
          className={styles.unitToggle}
          onClick={() => setUnit((prev) => (prev === "C" ? "F" : "C"))}
        >
          °{unit}
        </button>

        {isSearching && searchResults.length > 0 && (
          <div className={styles.searchResults}>
            {searchResults.map((city, idx) => (
              <div
                key={idx}
                className={styles.searchResultItem}
                onClick={() => handleSelectCity(city)}
              >
                <span>{city.name}</span>
                <span style={{ opacity: 0.6, fontSize: "11px" }}>{city.country}</span>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Quick Cities */}
      <div className={styles.quickCities}>
        {DEFAULT_CITIES.map((c) => (
          <button
            key={c.name}
            className={`${styles.quickCityBtn} ${selectedCity.name === c.name ? styles.active : ""}`}
            onClick={() => handleSelectCity(c)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--fg-muted)" }}>
          Fetching real-time satellite forecast...
        </div>
      ) : current ? (
        <>
          {/* Main Weather Card */}
          <div className={styles.mainCard}>
            <div>
              <div className={styles.cityName}>{selectedCity.name}</div>
              <div className={styles.countryName}>{selectedCity.country}</div>
              <div className={styles.conditionText}>
                <span style={{ fontSize: "20px", marginRight: "6px" }}>{weatherMeta.icon}</span>
                {weatherMeta.label}
              </div>
            </div>
            <div>
              <div className={styles.tempDisplay}>
                {convertTemp(current.temperature)}°{unit}
              </div>
              <div className={styles.feelsLike}>
                Feels like {convertTemp(current.apparentTemperature)}°{unit}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Humidity</div>
              <div className={styles.metricValue}>{current.humidity}%</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Wind</div>
              <div className={styles.metricValue}>{Math.round(current.windSpeed)} km/h</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Daylight</div>
              <div className={styles.metricValue}>{current.isDay ? "Day" : "Night"}</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Condition</div>
              <div className={styles.metricValue}>{weatherMeta.icon}</div>
            </div>
          </div>

          {/* Hourly Timeline */}
          <div className={styles.hourlySection}>
            <div className={styles.sectionTitle}>Hourly Forecast</div>
            <div className={styles.hourlyList}>
              {hourly.map((h, i) => (
                <div key={i} className={styles.hourlyCard}>
                  <span className={styles.hourlyTime}>{h.time}</span>
                  <span style={{ fontSize: "16px" }}>{getWeatherInfo(h.weatherCode).icon}</span>
                  <span className={styles.hourlyTemp}>{convertTemp(h.temperature)}°</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div className={styles.hourlySection}>
            <div className={styles.sectionTitle}>5-Day Forecast</div>
            <div className={styles.dailyList}>
              {daily.map((d, i) => (
                <div key={i} className={styles.dailyRow}>
                  <span className={styles.dailyDay}>{d.date}</span>
                  <span style={{ fontSize: "16px" }}>{getWeatherInfo(d.weatherCode).icon}</span>
                  <span className={styles.dailyCondition}>{getWeatherInfo(d.weatherCode).label}</span>
                  <div className={styles.dailyTemps}>
                    <span>{convertTemp(d.maxTemp)}°</span>
                    <span className={styles.dailyMin}>{convertTemp(d.minTemp)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
