'use client';

import { useEffect, useState } from 'react';

// Dateline weather: the reader's local current conditions, and a 7-day forecast
// that opens as a horizontally scrollable strip when clicked. Uses the browser's
// geolocation (with a Wasilla fallback if declined) and the keyless Open-Meteo
// API. No account needed.

const CODES: Record<number, string> = {
  0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
  56: 'Icy drizzle', 57: 'Icy drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Snow showers',
  95: 'Storms', 96: 'Storms', 99: 'Storms',
};

interface Cur { place: string; tempF: number; label: string }
interface Day { d: string; label: string; hi: number; lo: number }

const WASILLA = { lat: 61.5814, lon: -149.4394, place: 'Wasilla' };

function dayName(iso: string, i: number): string {
  if (i === 0) return 'Today';
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }); }
  catch { return ''; }
}

export default function WeatherBar() {
  const [cur, setCur] = useState<Cur | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let { lat, lon, place } = WASILLA;

      const pos = await new Promise<GeolocationPosition | null>((res) => {
        if (!('geolocation' in navigator)) return res(null);
        navigator.geolocation.getCurrentPosition((p) => res(p), () => res(null), { timeout: 7000, maximumAge: 600000 });
      });
      if (pos) {
        lat = pos.coords.latitude; lon = pos.coords.longitude; place = '';
        try {
          const g = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`).then((r) => r.json());
          place = g.city || g.locality || g.principalSubdivision || 'Local';
        } catch { place = 'Local'; }
      }

      try {
        const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`;
        const d: any = await fetch(u).then((r) => r.json());
        if (cancelled) return;
        if (d?.current && typeof d.current.temperature_2m === 'number') {
          setCur({ place, tempF: Math.round(d.current.temperature_2m), label: CODES[d.current.weather_code] || '' });
        }
        if (d?.daily?.time) {
          setDays(d.daily.time.map((t: string, i: number) => ({
            d: dayName(t, i),
            label: CODES[d.daily.weather_code[i]] || '',
            hi: Math.round(d.daily.temperature_2m_max[i]),
            lo: Math.round(d.daily.temperature_2m_min[i]),
          })));
        }
      } catch { /* offline; show nothing */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!cur) return null;

  return (
    <span className="wx mid">
      <button className="wx-cur" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="7-day forecast">
        {cur.place} {cur.tempF}&deg;F{cur.label ? `, ${cur.label}` : ''}
        {days.length > 0 && <span className="wx-caret">{open ? ' ▾' : ' ›'}</span>}
      </button>
      {open && days.length > 0 && (
        <span className="wx-strip" role="list">
          {days.map((x, i) => (
            <span className="wx-day" role="listitem" key={i}>
              <span className="wx-dn">{x.d}</span>
              <span className="wx-dl">{x.label}</span>
              <span className="wx-dt">{x.hi}&deg;<em>{x.lo}&deg;</em></span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
