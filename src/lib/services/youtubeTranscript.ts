/**
 * YouTube transcript extraction service
 */

import { YouTubeVideoInfo } from '../utils/youtube';

export interface YouTubeTranscript {
  videoId: string;
  title: string;
  description: string;
  duration: string;
  transcript: TranscriptSegment[];
  thumbnail: string;
  channel: string;
  publishedAt: string;
  viewCount: string;
}

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

/**
 * Extract video information and transcript using YouTube's public data
 */
export async function extractYouTubeVideoData(videoId: string): Promise<YouTubeTranscript | null> {
  const requestId = Date.now().toString(36);
  console.log(`=== Starting extractYouTubeVideoData for video: ${videoId} (ID: ${requestId}) ===`);
  
  try {
    // First, get video metadata
    console.log('Fetching video metadata...');
    const videoInfo = await getVideoMetadata(videoId);
    if (!videoInfo) {
      throw new Error('Could not fetch video metadata');
    }
    console.log(`Video metadata fetched: ${videoInfo.title}`);

    // Try to get transcript
    console.log('Fetching video transcript...');
    const transcript = await getVideoTranscript(videoId);
    console.log(`Transcript fetched: ${transcript?.length || 0} segments`);
    
    const result = {
      videoId,
      title: videoInfo.title,
      description: videoInfo.description,
      duration: videoInfo.duration,
      transcript: transcript || [],
      thumbnail: videoInfo.thumbnail,
      channel: videoInfo.channel,
      publishedAt: videoInfo.publishedAt,
      viewCount: videoInfo.viewCount,
    };
    
    console.log(`=== Completed extractYouTubeVideoData for video: ${videoId} (ID: ${requestId}) ===`);
    return result;
  } catch (error) {
    console.error('Error extracting YouTube video data:', error);
    return null;
  }
}

/**
 * Get video metadata from YouTube
 */
async function getVideoMetadata(videoId: string): Promise<any> {
  try {
    // Use a public YouTube video info API or scrape the page
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch video page');
    }

    const html = await response.text();
    
    // Extract video metadata from the page using multiple patterns
    const titleMatch = html.match(/"title":"([^"]+)"/) || html.match(/<title>([^<]+)<\/title>/);
    const descriptionMatch = html.match(/"description":"([^"]+)"/) || html.match(/"shortDescription":"([^"]+)"/);
    const thumbnailMatch = html.match(/"thumbnail":{"thumbnails":\[{"url":"([^"]+)"/) || html.match(/"thumbnailUrl":"([^"]+)"/);
    const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/) || html.match(/"author":"([^"]+)"/);
    const durationMatch = html.match(/"lengthSeconds":"([^"]+)"/) || html.match(/"duration":"([^"]+)"/);
    const viewCountMatch = html.match(/"viewCount":"([^"]+)"/) || html.match(/"interactionCount":"([^"]+)"/);
    const publishedAtMatch = html.match(/"uploadDate":"([^"]+)"/) || html.match(/"datePublished":"([^"]+)"/);

    return {
      title: titleMatch ? titleMatch[1].replace(/\\"/g, '"').replace(/\\u0026/g, '&') : 'Unknown Title',
      description: descriptionMatch ? descriptionMatch[1].replace(/\\"/g, '"').replace(/\\u0026/g, '&') : '',
      thumbnail: thumbnailMatch ? thumbnailMatch[1].replace(/\\u0026/g, '&') : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channel: channelMatch ? channelMatch[1].replace(/\\"/g, '"').replace(/\\u0026/g, '&') : 'Unknown Channel',
      duration: durationMatch ? formatDuration(parseInt(durationMatch[1])) : 'Unknown',
      viewCount: viewCountMatch ? formatViewCount(parseInt(viewCountMatch[1])) : 'Unknown',
      publishedAt: publishedAtMatch ? publishedAtMatch[1] : 'Unknown',
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
}

/**
 * Get video transcript from YouTube
 */
async function getVideoTranscript(videoId: string): Promise<TranscriptSegment[] | null> {
  const requestId = Date.now().toString(36);
  console.log(`=== Starting transcript extraction for video: ${videoId} (ID: ${requestId}) ===`);
  
  try {
    // Method 1: Try direct English transcript first (most common)
    console.log('Method 1: Trying direct English transcript...');
    try {
      const transcriptResponse = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
      });
      
      console.log(`Direct English transcript response status: ${transcriptResponse.status}`);
      
      if (transcriptResponse.ok) {
        const xml = await transcriptResponse.text();
        console.log(`Direct English transcript XML length: ${xml.length}`);
        
        if (xml.length > 100) { // Basic check that we got actual content
          const segments = parseTranscriptXml(xml);
          if (segments.length > 0) {
            console.log(`Successfully extracted English transcript with ${segments.length} segments`);
            return segments;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch direct English transcript:', error);
    }

    // Method 2: Try to get available transcript tracks
    console.log('Method 2: Checking available transcript tracks...');
    const tracksResponse = await fetch(`https://www.youtube.com/api/timedtext?type=list&v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    });

    console.log(`Tracks response status: ${tracksResponse.status}`);
    
    if (tracksResponse.ok) {
      const tracksXml = await tracksResponse.text();
      console.log(`Tracks XML length: ${tracksXml.length}`);
      console.log(`Tracks XML preview: ${tracksXml.substring(0, 500)}...`);
      
      const trackMatches = tracksXml.match(/lang_code="([^"]+)"/g);
      console.log(`Found ${trackMatches?.length || 0} language tracks`);
      
      if (trackMatches && trackMatches.length > 0) {
        // Try available languages (skip 'en' since we already tried it in Method 1)
        const availableLanguages = trackMatches.map(match => match.match(/lang_code="([^"]+)"/)?.[1]).filter(Boolean);
        
        console.log(`Available languages: ${availableLanguages.join(', ')}`);
        
        // Filter out 'en' since we already tried it, and prioritize other English variants
        const languagesToTry = availableLanguages.filter(lang => lang !== 'en');
        if (availableLanguages.includes('en-US')) languagesToTry.unshift('en-US');
        if (availableLanguages.includes('en-GB')) languagesToTry.unshift('en-GB');
        
        for (const lang of languagesToTry) {
          try {
            console.log(`Trying language: ${lang}`);
            const transcriptResponse = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
              },
            });
            
            console.log(`Transcript response status for ${lang}: ${transcriptResponse.status}`);
            
            if (transcriptResponse.ok) {
              const xml = await transcriptResponse.text();
              console.log(`Transcript XML length for ${lang}: ${xml.length}`);
              
              if (xml.length > 100) { // Basic check that we got actual content
                const segments = parseTranscriptXml(xml);
                if (segments.length > 0) {
                  console.log(`Successfully extracted transcript in ${lang} with ${segments.length} segments`);
                  return segments;
                } else {
                  console.log(`No segments found in transcript for ${lang}`);
                }
              } else {
                console.log(`Transcript XML too short for ${lang}: ${xml.length} characters`);
              }
            } else {
              console.log(`Failed to get transcript for ${lang}: ${transcriptResponse.status}`);
            }
          } catch (error) {
            console.warn(`Failed to fetch transcript for language ${lang}:`, error);
            continue;
          }
        }
      } else {
        console.log('No language tracks found in tracks XML');
      }
    } else {
      console.log(`Failed to get tracks: ${tracksResponse.status}`);
    }

    // Method 2: Try direct English transcript (already tried in Method 1, skipping duplicate)

    // Method 2: Extract transcript URL from video page
    try {
      console.log('Method 2: Extracting transcript URL from video page...');
      const videoResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
      });

      if (videoResponse.ok) {
        const html = await videoResponse.text();
        console.log(`Video page HTML length: ${html.length}`);
        
        // Look for caption tracks in the page
        const captionTracksMatch = html.match(/"captionTracks":\s*\[([^\]]+)\]/);
        if (captionTracksMatch) {
          console.log('Found caption tracks in video page');
          
          // Parse the caption tracks JSON
          try {
            const captionTracksJson = `[${captionTracksMatch[1]}]`;
            const captionTracks = JSON.parse(captionTracksJson);
            
            console.log(`Found ${captionTracks.length} caption tracks`);
            
            // Look for English transcript
            for (const track of captionTracks) {
              if (track.languageCode === 'en' || track.languageCode === 'en-US' || track.languageCode === 'en-GB') {
                console.log(`Found English transcript track: ${track.languageCode}`);
                
                if (track.baseUrl) {
                  // Decode the URL
                  const transcriptUrl = track.baseUrl.replace(/\\u0026/g, '&');
                  console.log(`Transcript URL: ${transcriptUrl}`);
                  
                  // Fetch the transcript
                  const transcriptResponse = await fetch(transcriptUrl, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                  });
                  
                  if (transcriptResponse.ok) {
                    const xml = await transcriptResponse.text();
                    console.log(`Transcript XML length: ${xml.length}`);
                    
                    if (xml.length > 100) {
                      const segments = parseTranscriptXml(xml);
                      if (segments.length > 0) {
                        console.log(`Successfully extracted transcript from video page with ${segments.length} segments`);
                        return segments;
                      }
                    }
                  }
                }
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse caption tracks JSON:', parseError);
          }
        } else {
          console.log('No caption tracks found in video page');
        }
      }
    } catch (error) {
      console.warn('Failed to extract transcript from video page:', error);
    }

    console.log(`=== No transcript available for this video (ID: ${requestId}) ===`);
    return null;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return null;
  }
}

/**
 * Parse YouTube transcript XML
 */
function parseTranscriptXml(xml: string): TranscriptSegment[] {
  console.log(`Parsing transcript XML, length: ${xml.length}`);
  console.log(`XML preview: ${xml.substring(0, 200)}...`);
  
  const segments: TranscriptSegment[] = [];
  
  // Multiple regex patterns to handle different XML formats
  const patterns = [
    /<text start="([^"]+)" dur="([^"]+)">([^<]+)<\/text>/g,
    /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]+)<\/text>/g,
    /<text start="([^"]+)">([^<]+)<\/text>/g,
    /<text start="([^"]+)"[^>]*>([^<]+)<\/text>/g,
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    console.log(`Trying pattern ${i + 1}: ${pattern.source}`);
    
    let match;
    let matchCount = 0;
    while ((match = pattern.exec(xml)) !== null) {
      matchCount++;
      const start = parseFloat(match[1]);
      const duration = match[2] ? parseFloat(match[2]) : 5; // Default 5 seconds if duration not specified
      const text = decodeHtmlEntities(match[3] || match[2]);
      
      // Only add if we have valid text
      if (text && text.trim().length > 0) {
        segments.push({
          start,
          duration,
          text: text.trim(),
        });
      }
    }
    
    console.log(`Pattern ${i + 1} found ${matchCount} matches, ${segments.length} valid segments`);
    
    // If we found segments with this pattern, break
    if (segments.length > 0) {
      break;
    }
  }
  
  // Sort segments by start time
  segments.sort((a, b) => a.start - b.start);
  
  console.log(`Final result: ${segments.length} transcript segments`);
  if (segments.length > 0) {
    console.log(`First segment: ${segments[0].text.substring(0, 50)}...`);
    console.log(`Last segment: ${segments[segments.length - 1].text.substring(0, 50)}...`);
  }
  
  return segments;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (match) => entities[match]);
}

/**
 * Format duration from seconds to readable format
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format view count
 */
function formatViewCount(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
} 