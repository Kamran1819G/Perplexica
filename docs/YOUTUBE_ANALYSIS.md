# 🎥 YouTube Video Analysis Feature

Perplexify now includes a powerful YouTube video analysis feature that automatically detects YouTube links in messages and provides intelligent responses based on video content. This feature works sim

## How It Works

### 1. Automatic Link Detection
- The system automatically detects YouTube URLs in user messages
- Supports various YouTube URL formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`
  - `https://www.youtube.com/v/VIDEO_ID`

### 2. Video Data Extraction
- Extracts video metadata including:
  - Title
  - Channel name
  - Duration
  - View count
  - Publication date
  - Thumbnail
  - Description

### 3. Transcript Processing
- Attempts to extract video transcripts when available
- Falls back to metadata-based summarization when transcripts are not available
- Handles multiple language transcripts

### 4. AI-Powered Analysis
- Uses the configured AI model to provide intelligent responses
- Understands user intent (recipe, tutorial, summary, etc.)
- Provides contextually appropriate responses
- Maintains accuracy and relevance to user requests

## Usage

### Simple Usage
Just paste a YouTube URL in your message and send it. The system will automatically:

1. Detect the YouTube link
2. Extract video information
3. Analyze your request and provide appropriate response
4. Display the results in a formatted response

### Examples
```
User: Can you summarize this video? https://www.youtube.com/watch?v=dQw4w9WgXcQ
User: Give me the recipe from this video https://www.youtube.com/watch?v=example
User: How do I do this tutorial? https://www.youtube.com/watch?v=example
```

The system will respond with contextually appropriate information including:
- Video information (title, channel, duration, views)
- Response tailored to your request (recipe, tutorial, summary, etc.)
- Practical details and instructions when relevant
- Link to watch the original video

## Technical Implementation

### Files Added/Modified

#### New Files:
- `src/lib/utils/youtube.ts` - YouTube link detection and video ID extraction
- `src/lib/services/youtubeTranscript.ts` - Video data and transcript extraction
- `src/app/api/youtube/route.ts` - YouTube analysis API endpoint
- `src/components/YouTubeVideoCard.tsx` - Video information display component

#### Modified Files:
- `src/app/api/chat/route.ts` - Added YouTube link detection and processing
- `src/app/globals.css` - Added line-clamp utility for text truncation

### API Endpoints

#### POST `/api/youtube`
Analyzes YouTube videos and provides intelligent responses based on user requests.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "chatHistory": [...],
  "chatModel": {
    "provider": "openai",
    "name": "gpt-4"
  },
  "systemInstructions": "Optional custom instructions"
}
```

**Response:**
```json
{
  "summary": "Generated summary text...",
  "videoInfo": {
    "title": "Video Title",
    "channel": "Channel Name",
    "duration": "10:30",
    "viewCount": "1.2M",
    "publishedAt": "2024-01-01",
    "thumbnail": "https://...",
    "description": "Video description...",
    "videoId": "VIDEO_ID",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  },
  "hasTranscript": true
}
```

## Features

### ✅ Implemented
- Automatic YouTube link detection
- Video metadata extraction
- Transcript extraction (when available)
- AI-powered intelligent analysis
- User intent understanding (recipe, tutorial, summary, etc.)
- Contextually appropriate responses
- Fallback handling for unavailable transcripts
- Error handling for private/deleted videos
- Formatted response display

### 🔄 Future Enhancements
- Support for YouTube playlists
- Video chapter extraction
- Multiple video processing
- Custom response styles
- Transcript language detection
- Video quality analysis
- Enhanced recipe extraction
- Step-by-step tutorial generation

## Error Handling

The system handles various error scenarios:

1. **Invalid URLs**: Returns error for non-YouTube URLs
2. **Private Videos**: Handles access restrictions gracefully
3. **Deleted Videos**: Provides clear error messages
4. **No Transcript**: Falls back to metadata-based summarization
5. **API Failures**: Graceful degradation with helpful error messages

## Configuration

The feature uses the same AI model configuration as the main chat system. Users can:

- Select different AI models for summarization
- Customize system instructions
- Use different optimization modes (speed/balanced/quality)

## Limitations

- Requires public YouTube videos (private videos cannot be processed)
- Transcript availability depends on video settings
- Some videos may have restricted access
- Processing time depends on video length and transcript availability

## Troubleshooting

### Common Issues

1. **"Could not extract video data"**
   - Check if the video is public
   - Verify the URL format
   - Try refreshing the page

2. **"No transcript available"**
   - The video may not have captions enabled
   - Summary will be based on metadata only

3. **Slow processing**
   - Longer videos take more time to process
   - Check your internet connection
   - Try with a shorter video first

### Support

For issues or feature requests, please:
1. Check the error message for specific details
2. Verify the YouTube URL is accessible
3. Try with a different video to isolate the issue
4. Report bugs with specific URLs and error messages 