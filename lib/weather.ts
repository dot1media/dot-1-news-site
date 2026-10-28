// Newsroom weather for the dateline: Wasilla, Alaska, from the keyless
// Open-Meteo API. Classic nameplate weather, the paper's own city, so it needs
// no reader permission. Fetched at request time on the server, cached 30 min,
// and degrades to nothing if the API is unreachable.

const WASILLA = { lat: 61.5814, lon: -149.4394 };

const CODES: Record<number, string> = {
  0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
  56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Snow showers',
  95: 'Thunderstorms', 96: 'Thunderstorms', 99: 'Thunderstorms',
};

export async function getWeather(): Promise<{ tempF: number; label: string } | null> {
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${WASILLA.lat}&longitude=${WASILLA.lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FAnchorage`;
    const r = await fetch(u, { next: { revalidate: 1800 } });
    if (!r.ok) return null;
    const d: any = await r.json();
    const t = d?.current?.temperature_2m;
    const c = d?.current?.weather_code;
    if (typeof t !== 'number') return null;
    return { tempF: Math.round(t), label: CODES[c] || '' };
  } catch {
    return null;
  }
}
