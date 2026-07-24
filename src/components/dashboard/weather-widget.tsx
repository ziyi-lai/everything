"use client";

import { useEffect, useState } from "react";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from "lucide-react";

// Kuala Lumpur — matches APP_TIMEZONE, used when geolocation is denied/unavailable.
const FALLBACK_COORDS = { latitude: 3.139, longitude: 101.6869 };

type WeatherState = { temperature: number; code: number } | null;

/** WMO weather code -> icon + animation + label. https://open-meteo.com/en/docs */
function weatherVisual(code: number) {
  if (code === 0) return { Icon: Sun, label: "CLEAR", spin: true };
  if (code <= 2) return { Icon: Sun, label: "PARTLY CLOUDY", spin: true };
  if (code === 3) return { Icon: Cloud, label: "OVERCAST", spin: false };
  if (code === 45 || code === 48) return { Icon: CloudFog, label: "FOG", spin: false };
  if (code >= 51 && code <= 67) return { Icon: CloudRain, label: "RAIN", bounce: true };
  if (code >= 71 && code <= 86) return { Icon: CloudSnow, label: "SNOW", bounce: true };
  if (code >= 95) return { Icon: CloudLightning, label: "STORM", pulse: true };
  return { Icon: Cloud, label: "CLOUDY", spin: false };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherState>(null);

  useEffect(() => {
    let cancelled = false;

    function fetchAt(latitude: number, longitude: number) {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`
      )
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !data.current) return;
          setWeather({ temperature: Math.round(data.current.temperature_2m), code: data.current.weather_code });
        })
        .catch(() => {});
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchAt(pos.coords.latitude, pos.coords.longitude),
        () => fetchAt(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude),
        { timeout: 5000 }
      );
    } else {
      fetchAt(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (!weather) return null;

  const { Icon, label, spin, bounce, pulse } = weatherVisual(weather.code);
  const animation = spin ? "animate-[spin_8s_linear_infinite]" : bounce ? "animate-bounce" : pulse ? "animate-pulse" : "";

  return (
    <div className="flex items-center gap-2 text-muted" title={label}>
      <Icon size={18} strokeWidth={1.5} className={animation} />
      <span className="font-mono text-body-sm tabular-nums">{weather.temperature}°C</span>
    </div>
  );
}
