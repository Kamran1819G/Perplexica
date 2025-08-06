import { Cloud, Sun, CloudRain, CloudSnow, Wind, MapPin, Thermometer, Gauge } from 'lucide-react';
import { useEffect, useState } from 'react';

const WeatherWidget = () => {
  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };
  
  const [data, setData] = useState({
    temperature: 0,
    feelsLike: 0,
    condition: '',
    location: '',
    humidity: 0,
    windSpeed: 0,
    windDirection: 0,
    pressure: 0,
    icon: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreciseLocation, setShowPreciseLocation] = useState(false);
  const [isUsingPreciseLocation, setIsUsingPreciseLocation] = useState(false);
  const [geolocationPermission, setGeolocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  const getApproxLocation = async () => {
    const res = await fetch('https://ipwhois.app/json/');
    const data = await res.json();

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
    };
  };

  const getPreciseLocation = async (): Promise<{
    latitude: number;
    longitude: number;
    city: string;
  } | null> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const res = await fetch(
                `https://api-bdc.io/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                },
              );

              const data = await res.json();

              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                city: data.locality,
              });
            } catch (error) {
              console.error('Error getting precise location:', error);
              resolve(null);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      } else {
        resolve(null);
      }
    });
  };

  const fetchWeatherData = async (location: {
    latitude: number;
    longitude: number;
    city: string;
  }) => {
    try {
      setError(null);
      const res = await fetch(`/api/weather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: location.latitude,
          lng: location.longitude,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Error fetching weather data:', data.message);
        setError(data.message || 'Failed to fetch weather data');
        setLoading(false);
        return;
      }

      setData({
        temperature: data.temperature || 0,
        feelsLike: data.feelsLike || data.temperature || 0,
        condition: data.condition || 'Unknown',
        location: location.city || 'Unknown Location',
        humidity: data.humidity || 0,
        windSpeed: data.windSpeed || 0,
        windDirection: data.windDirection || 0,
        pressure: data.pressure || 1013,
        icon: data.icon || 'clear-day',
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Unable to fetch weather data');
      setLoading(false);
    }
  };

  const handlePreciseLocationClick = async () => {
    setLoading(true);
    const preciseLocation = await getPreciseLocation();
    
    if (preciseLocation) {
      setIsUsingPreciseLocation(true);
      setGeolocationPermission('granted');
      await fetchWeatherData(preciseLocation);
    } else {
      // Fallback to approximate location if precise location fails
      const approxLocation = await getApproxLocation();
      await fetchWeatherData(approxLocation);
    }
    
    setShowPreciseLocation(false);
  };

  useEffect(() => {
    const getLocation = async (
      callback: (location: {
        latitude: number;
        longitude: number;
        city: string;
      }) => void,
    ) => {
      if (navigator.geolocation) {
        try {
          const result = await navigator.permissions.query({
            name: 'geolocation',
          });

          setGeolocationPermission(result.state);

          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition(async (position) => {
              try {
                setIsUsingPreciseLocation(true);
                const res = await fetch(
                  `https://api-bdc.io/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
                  {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  },
                );

                const data = await res.json();

                callback({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  city: data.locality,
                });
              } catch (error) {
                console.error('Error getting location details:', error);
                // Fallback to approximate location
                const approxLocation = await getApproxLocation();
                callback(approxLocation);
              }
            });
          } else {
            // For 'prompt' or 'denied' states, use approximate location
            const approxLocation = await getApproxLocation();
            callback(approxLocation);
          }
        } catch (error) {
          console.error('Error checking geolocation permission:', error);
          setGeolocationPermission('unknown');
          const approxLocation = await getApproxLocation();
          callback(approxLocation);
        }
      } else {
        setGeolocationPermission('denied');
        const approxLocation = await getApproxLocation();
        callback(approxLocation);
      }
    };

    getLocation(async (location) => {
      await fetchWeatherData(location);
    });
  }, []);

  // Only show precise location button if permission is not granted and we're not using precise location
  const shouldShowPreciseButton = geolocationPermission !== 'granted' && !isUsingPreciseLocation;

  return (
    <div 
      className="relative"
      onMouseEnter={() => shouldShowPreciseButton && setShowPreciseLocation(true)}
      onMouseLeave={() => setShowPreciseLocation(false)}
    >
      <div 
        className={`bg-light-secondary dark:bg-dark-secondary rounded-xl border border-light-200 dark:border-dark-200 shadow-sm flex flex-row items-center w-full h-24 min-h-[96px] max-h-[96px] px-3 py-2 gap-3 transition-all duration-200 hover:shadow-md ${
          showPreciseLocation && shouldShowPreciseButton ? 'blur-sm' : ''
        }`}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center w-full h-full text-center px-4">
            <div className="text-red-500 dark:text-red-400 text-sm mb-2">
              Weather Unavailable
            </div>
            <div className="text-xs text-black/60 dark:text-white/60">
              {error}
            </div>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                // Retry with approximate location
                getApproxLocation().then(fetchWeatherData);
              }}
              className="mt-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <>
            <div className="flex flex-col items-center justify-center w-16 min-w-16 max-w-16 h-full animate-pulse">
              <div className="h-10 w-10 rounded-full bg-light-200 dark:bg-dark-200 mb-2" />
              <div className="h-4 w-10 rounded bg-light-200 dark:bg-dark-200" />
            </div>
            <div className="flex flex-col justify-between flex-1 h-full py-1 animate-pulse">
              <div className="flex flex-row items-center justify-between">
                <div className="h-3 w-20 rounded bg-light-200 dark:bg-dark-200" />
                <div className="h-3 w-12 rounded bg-light-200 dark:bg-dark-200" />
              </div>
              <div className="h-3 w-16 rounded bg-light-200 dark:bg-dark-200 mt-1" />
              <div className="flex flex-row justify-between w-full mt-auto pt-1 border-t border-light-200 dark:border-dark-200">
                <div className="h-3 w-16 rounded bg-light-200 dark:bg-dark-200" />
                <div className="h-3 w-8 rounded bg-light-200 dark:bg-dark-200" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center w-16 min-w-16 max-w-16 h-full">
              <img
                src={`/weather-ico/${data.icon}.svg`}
                alt={data.condition}
                className="h-10 w-auto"
              />
              <span className="text-base font-semibold text-black dark:text-white">
                {data.temperature}°C
              </span>
              <span className="text-xs text-black/60 dark:text-white/60">
                Feels {data.feelsLike}°C
              </span>
            </div>
            <div className="flex flex-col justify-between flex-1 h-full py-1">
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-black dark:text-white">
                    {data.location}
                  </span>
                  {isUsingPreciseLocation && (
                    <MapPin className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                  )}
                </div>
                <span className="flex items-center text-xs text-black/60 dark:text-white/60">
                  <Wind className="w-3 h-3 mr-1" />
                  {data.windSpeed} km/h {getWindDirection(data.windDirection)}
                </span>
              </div>
              <span className="text-xs text-black/60 dark:text-white/60 mt-1">
                {data.condition}
              </span>
              <div className="flex flex-row justify-between w-full mt-auto pt-1 border-t border-light-200 dark:border-dark-200 text-xs text-black/60 dark:text-white/60">
                <div className="flex items-center space-x-1">
                  <Gauge className="w-3 h-3" />
                  <span>{data.pressure} hPa</span>
                </div>
                <span>Humidity: {data.humidity}%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Precise Location Overlay - Only show if permission not granted */}
      {showPreciseLocation && shouldShowPreciseButton && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10 bg-white/40 dark:bg-white/20 backdrop-blur-[2px]">
          <button
            onClick={handlePreciseLocationClick}
            className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 shadow-xl border-0"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Use Precise Location</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;