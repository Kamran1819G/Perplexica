// Simple in-memory cache for weather data
const weatherCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export const POST = async (req: Request) => {
  try {
    const body: { lat: number; lng: number } = await req.json();

    if (!body.lat || !body.lng) {
      return Response.json(
        {
          message: 'Invalid request.',
        },
        { status: 400 },
      );
    }

    // Create cache key based on rounded coordinates (to group nearby locations)
    const cacheKey = `${Math.round(body.lat * 100) / 100},${Math.round(body.lng * 100) / 100}`;
    const now = Date.now();
    
    // Check if we have valid cached data
    const cached = weatherCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return Response.json(cached.data);
    }

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${body.lat}&longitude=${body.lng}&current=weather_code,temperature_2m,apparent_temperature,is_day,relative_humidity_2m,wind_speed_10m,wind_direction_10m,pressure_msl&timezone=auto`,
      {
        headers: {
          'User-Agent': 'Perplexica Weather Widget',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      }
    );

    if (!res.ok) {
      console.error(`Weather API responded with status: ${res.status}`);
      return Response.json(
        {
          message: 'Weather service temporarily unavailable.',
        },
        { status: 503 },
      );
    }

    const data = await res.json();

    if (data.error) {
      console.error(`Error fetching weather data: ${data.reason}`);
      return Response.json(
        {
          message: 'Weather data temporarily unavailable.',
        },
        { status: 503 },
      );
    }

    // Validate required data fields
    if (!data.current || typeof data.current.temperature_2m !== 'number') {
      console.error('Invalid weather data received');
      return Response.json(
        {
          message: 'Invalid weather data received.',
        },
        { status: 502 },
      );
    }

    const weather: {
      temperature: number;
      feelsLike: number;
      condition: string;
      humidity: number;
      windSpeed: number;
      windDirection: number;
      pressure: number;
      icon: string;
    } = {
      temperature: Math.round(data.current.temperature_2m || 0),
      feelsLike: Math.round(data.current.apparent_temperature || data.current.temperature_2m || 0),
      condition: '',
      humidity: data.current.relative_humidity_2m || 0,
      windSpeed: Math.round(data.current.wind_speed_10m || 0),
      windDirection: data.current.wind_direction_10m || 0,
      pressure: Math.round(data.current.pressure_msl || 1013),
      icon: '',
    };

    const code = data.current.weather_code ?? 0;
    const isDay = data.current.is_day === 1;
    const dayOrNight = isDay ? 'day' : 'night';

    switch (code) {
      case 0:
        weather.icon = `clear-${dayOrNight}`;
        weather.condition = 'Clear';
        break;

      case 1:
        weather.condition = 'Mainly Clear';
        weather.icon = `clear-${dayOrNight}`;
        break;
      case 2:
        weather.condition = 'Partly Cloudy';
        weather.icon = `cloudy-1-${dayOrNight}`;
        break;
      case 3:
        weather.condition = 'Cloudy';
        weather.icon = `cloudy-1-${dayOrNight}`;
        break;

      case 45:
        weather.condition = 'Fog';
        weather.icon = `fog-${dayOrNight}`;
        break;
      case 48:
        weather.condition = 'Depositing Rime Fog';
        weather.icon = `fog-${dayOrNight}`;
        break;

      case 51:
        weather.condition = 'Light Drizzle';
        weather.icon = `rainy-1-${dayOrNight}`;
        break;
      case 53:
        weather.condition = 'Moderate Drizzle';
        weather.icon = `rainy-1-${dayOrNight}`;
        break;
      case 55:
        weather.condition = 'Dense Drizzle';
        weather.icon = `rainy-1-${dayOrNight}`;
        break;

      case 56:
        weather.condition = 'Light Freezing Drizzle';
        weather.icon = `frost-${dayOrNight}`;
        break;
      case 57:
        weather.condition = 'Dense Freezing Drizzle';
        weather.icon = `frost-${dayOrNight}`;
        break;

      case 61:
        weather.condition = 'Slight Rain';
        weather.icon = `rainy-2-${dayOrNight}`;
        break;
      case 63:
        weather.condition = 'Moderate Rain';
        weather.icon = `rainy-2-${dayOrNight}`;
        break;
      case 65:
        weather.condition = 'Heavy Rain';
        weather.icon = `rainy-2-${dayOrNight}`;
        break;

      case 66:
        weather.condition = 'Light Freezing Rain';
        weather.icon = 'rain-and-sleet-mix';
        break;
      case 67:
        weather.condition = 'Heavy Freezing Rain';
        weather.icon = 'rain-and-sleet-mix';
        break;

      case 71:
        weather.condition = 'Slight Snow Fall';
        weather.icon = `snowy-2-${dayOrNight}`;
        break;
      case 73:
        weather.condition = 'Moderate Snow Fall';
        weather.icon = `snowy-2-${dayOrNight}`;
        break;
      case 75:
        weather.condition = 'Heavy Snow Fall';
        weather.icon = `snowy-2-${dayOrNight}`;
        break;

      case 77:
        weather.condition = 'Snow';
        weather.icon = `snowy-1-${dayOrNight}`;
        break;

      case 80:
        weather.condition = 'Slight Rain Showers';
        weather.icon = `rainy-3-${dayOrNight}`;
        break;
      case 81:
        weather.condition = 'Moderate Rain Showers';
        weather.icon = `rainy-3-${dayOrNight}`;
        break;
      case 82:
        weather.condition = 'Heavy Rain Showers';
        weather.icon = `rainy-3-${dayOrNight}`;
        break;

      case 85:
        weather.condition = 'Slight Snow Showers';
        weather.icon = `snowy-3-${dayOrNight}`;
        break;
      case 86:
        weather.condition = 'Moderate Snow Showers';
        weather.icon = `snowy-3-${dayOrNight}`;
        break;
      case 87:
        weather.condition = 'Heavy Snow Showers';
        weather.icon = `snowy-3-${dayOrNight}`;
        break;

      case 95:
        weather.condition = 'Thunderstorm';
        weather.icon = `scattered-thunderstorms-${dayOrNight}`;
        break;

      case 96:
        weather.condition = 'Thunderstorm with Slight Hail';
        weather.icon = 'severe-thunderstorm';
        break;
      case 99:
        weather.condition = 'Thunderstorm with Heavy Hail';
        weather.icon = 'severe-thunderstorm';
        break;

      default:
        weather.icon = `clear-${dayOrNight}`;
        weather.condition = 'Clear';
        break;
    }

    // Cache the result
    weatherCache.set(cacheKey, { data: weather, timestamp: now });
    
    // Clean up old cache entries periodically
    if (weatherCache.size > 100) {
      const cutoff = now - CACHE_DURATION;
      for (const [key, value] of weatherCache.entries()) {
        if (value.timestamp < cutoff) {
          weatherCache.delete(key);
        }
      }
    }

    return Response.json(weather);
  } catch (err) {
    console.error('An error occurred while getting home widgets', err);
    return Response.json(
      {
        message: 'An error has occurred.',
      },
      {
        status: 500,
      },
    );
  }
};
