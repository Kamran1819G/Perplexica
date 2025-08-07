/**
 * Personalization utilities for enhancing AI responses with user context
 */

export interface PersonalizationData {
  introduceYourself?: string;
  userLocation?: string;
  locationEnabled?: boolean;
}

/**
 * Get personalization data from localStorage
 */
export const getPersonalizationData = (): PersonalizationData => {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    introduceYourself: localStorage.getItem('introduceYourself') || undefined,
    userLocation: localStorage.getItem('userLocation') || undefined,
    locationEnabled: localStorage.getItem('locationEnabled') === 'true',
  };
};

/**
 * Enhance system instructions with personalization data
 */
export const enhanceSystemInstructions = (
  baseInstructions: string,
  personalizationData: PersonalizationData
): string => {
  let enhancedInstructions = baseInstructions || '';

  // Add user introduction if available
  if (personalizationData.introduceYourself?.trim()) {
    enhancedInstructions += `\n\nUser Context: ${personalizationData.introduceYourself.trim()}`;
  }

  // Add location context if available
  if (personalizationData.userLocation?.trim()) {
    enhancedInstructions += `\n\nUser Location: ${personalizationData.userLocation.trim()}`;
  }

  return enhancedInstructions;
};

/**
 * Get enhanced system instructions with personalization
 */
export const getEnhancedSystemInstructions = (baseInstructions?: string): string => {
  const personalizationData = getPersonalizationData();
  return enhanceSystemInstructions(baseInstructions || '', personalizationData);
};

/**
 * Check if personalization data is available
 */
export const hasPersonalizationData = (): boolean => {
  const data = getPersonalizationData();
  return !!(data.introduceYourself?.trim() || data.userLocation?.trim());
};
