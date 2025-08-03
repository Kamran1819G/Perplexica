/**
 * YouTube utility functions for link detection and video ID extraction
 */

export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  title?: string;
  description?: string;
  duration?: string;
  thumbnail?: string;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if a string contains a YouTube URL
 */
export function containsYouTubeLink(text: string): boolean {
  const youtubePatterns = [
    /https?:\/\/(www\.)?youtube\.com\/watch\?v=[^&\s]+/,
    /https?:\/\/youtu\.be\/[^&\s]+/,
    /https?:\/\/(www\.)?youtube\.com\/embed\/[^&\s]+/,
    /https?:\/\/(www\.)?youtube\.com\/v\/[^&\s]+/,
  ];

  return youtubePatterns.some(pattern => pattern.test(text));
}

/**
 * Extract all YouTube links from text
 */
export function extractYouTubeLinks(text: string): string[] {
  const youtubePatterns = [
    /https?:\/\/(www\.)?youtube\.com\/watch\?v=[^&\s]+/g,
    /https?:\/\/youtu\.be\/[^&\s]+/g,
    /https?:\/\/(www\.)?youtube\.com\/embed\/[^&\s]+/g,
    /https?:\/\/(www\.)?youtube\.com\/v\/[^&\s]+/g,
  ];

  const links: string[] = [];
  
  youtubePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      links.push(...matches);
    }
  });

  return [...new Set(links)]; // Remove duplicates
}

/**
 * Get YouTube video info from URL
 */
export function getYouTubeVideoInfo(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  return {
    videoId,
    url,
  };
}

/**
 * Validate YouTube video ID format
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  // YouTube video IDs are typically 11 characters long
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

/**
 * Debug function to test YouTube link detection
 */
export function debugYouTubeLink(text: string): {
  containsLink: boolean;
  links: string[];
  videoIds: string[];
  isValid: boolean[];
} {
  const containsLink = containsYouTubeLink(text);
  const links = extractYouTubeLinks(text);
  const videoIds = links.map(link => extractYouTubeVideoId(link)).filter(Boolean) as string[];
  const isValid = videoIds.map(id => isValidYouTubeVideoId(id));

  return {
    containsLink,
    links,
    videoIds,
    isValid,
  };
} 