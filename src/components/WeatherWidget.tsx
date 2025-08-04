import { Cloud, Sun, CloudRain, CloudSnow, Wind, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

const WeatherWidget = () => {
  const [data, setData] = useState({
    temperature: 0,
    condition: '',
    location: '',
    humidity: 0,
    windSpeed: 0,
    icon: '',
  });
  const [loading, setLoading] = useState(true);
  const [showPreciseLocation, setShowPreciseLocation] = useState(false);
  const [isUsingPreciseLocation, setIsUsingPreciseLocation] = useState(false);

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
      const res = await fetch(`/api/weather`, {
        method: 'POST',
        body: JSON.stringify({
          lat: location.latitude,
          lng: location.longitude,
        }),
      });

      const data = await res.json();

      if (res.status !== 200) {
        console.error('Error fetching weather data');
        setLoading(false);
        return;
      }

      setData({
        temperature: data.temperature,
        condition: data.condition,
        location: location.city,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        icon: data.icon,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setLoading(false);
    }
  };

  const handlePreciseLocationClick = async () => {
    setLoading(true);
    const preciseLocation = await getPreciseLocation();
    
    if (preciseLocation) {
      setIsUsingPreciseLocation(true);
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
        const result = await navigator.permissions.query({
          name: 'geolocation',
        });

        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition(async (position) => {
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
          });
        } else if (result.state === 'prompt') {
          callback(await getApproxLocation());
          navigator.geolocation.getCurrentPosition((position) => {});
        } else if (result.state === 'denied') {
          callback(await getApproxLocation());
        }
      } else {
        callback(await getApproxLocation());
      }
    };

    getLocation(async (location) => {
      await fetchWeatherData(location);
    });
  }, []);

  return (
    <div className="relative">
      <div 
        className={`bg-light-secondary dark:bg-dark-secondary rounded-xl border border-light-200 dark:border-dark-200 shadow-sm flex flex-row items-center w-full h-24 min-h-[96px] max-h-[96px] px-3 py-2 gap-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
          showPreciseLocation && !isUsingPreciseLocation ? 'backdrop-blur-sm bg-black/50' : ''
        }`}
        onMouseEnter={() => !isUsingPreciseLocation && setShowPreciseLocation(true)}
        onMouseLeave={() => setShowPreciseLocation(false)}
      >
        {loading ? (
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
            </div>
            <div className="flex flex-col justify-between flex-1 h-full py-1">
              <div className="flex flex-row items-center justify-between">
                <span className="text-xs font-medium text-black dark:text-white">
                  {data.location}
                </span>
                <span className="flex items-center text-xs text-black/60 dark:text-white/60">
                  <Wind className="w-3 h-3 mr-1" />
                  {data.windSpeed} km/h
                </span>
              </div>
              <span className="text-xs text-black/60 dark:text-white/60 mt-1">
                {data.condition}
              </span>
              <div className="flex flex-row justify-between w-full mt-auto pt-1 border-t border-light-200 dark:border-dark-200 text-xs text-black/60 dark:text-white/60">
                <span>Humidity: {data.humidity}%</span>
                <span>Now</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Precise Location Overlay */}
      {showPreciseLocation && !isUsingPreciseLocation && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10">
          <button
            onClick={handlePreciseLocationClick}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 border border-gray-600"
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