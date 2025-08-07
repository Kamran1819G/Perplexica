'use client';

import { useState, useEffect } from 'react';
import { PersonalizationData, getPersonalizationData } from '@/lib/utils/personalization';

export function usePersonalization() {
  const [personalizationData, setPersonalizationData] = useState<PersonalizationData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load personalization data from localStorage
    const loadPersonalizationData = () => {
      const data = getPersonalizationData();
      setPersonalizationData(data);
      setIsLoading(false);
    };

    loadPersonalizationData();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'introduceYourself' || e.key === 'userLocation' || e.key === 'locationEnabled') {
        loadPersonalizationData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updatePersonalizationData = (key: keyof PersonalizationData, value: string | boolean) => {
    if (typeof window !== 'undefined') {
      if (typeof value === 'boolean') {
        localStorage.setItem(key, value.toString());
      } else {
        localStorage.setItem(key, value);
      }
      
      setPersonalizationData(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  return {
    personalizationData,
    isLoading,
    updatePersonalizationData,
    hasData: !!(personalizationData.introduceYourself?.trim() || personalizationData.userLocation?.trim()),
  };
}
