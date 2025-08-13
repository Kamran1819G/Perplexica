import { NextRequest } from 'next/server';
import { extractYouTubeVideoData } from '@/lib/services/youtubeTranscript';
import { extractYouTubeVideoId, containsYouTubeLink } from '@/lib/utils/youtube';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { getAvailableChatModelProviders } from '@/lib/providers';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface YouTubeSummaryBody {
  url: string;
  chatHistory: Array<{ role: string; content: string }>;
  chatModel?: {
    provider: string;
    name: string;
  };
  systemInstructions?: string;
}

const YouTubeSummaryPrompt = `
You are an expert at analyzing YouTube videos and providing direct responses based on video content without verbose introductions.

## Video Information:
- Title: {title}
- Channel: {channel}
- Duration: {duration}
- Views: {viewCount}
- Published: {publishedAt}
- Description: {description}

## Transcript:
{transcript}

### Critical Response Rules
- **NEVER start with phrases like**: "Of course", "Here is", "I'll help you", "Let me provide", "Certainly", "Based on the video", or similar introductory statements
- **Start immediately with the core content** the user is requesting
- **Be direct and actionable** - jump straight into the recipe, steps, or information
- **No verbose openings** - lead with the actual content or answer

## User Request Analysis:
Analyze what the user is asking for and respond accordingly:
- Recipe extraction and instructions → Start with ingredients list
- Step-by-step tutorials → Start with step 1
- Key points and insights → Start with the main insight
- Summary of content → Start with the core topic/conclusion
- Specific information or tips → Start with the specific answer
- Analysis or review → Start with the main assessment

## Response Guidelines:
1. **Lead with the content** - First line should contain the actual information requested
2. **Provide the most relevant response** based on their request
3. **Structure your response appropriately** for the type of content requested
4. **Include practical details** like ingredients, steps, measurements, timestamps, etc.
5. **Be comprehensive and actionable** when possible
6. **Use appropriate formatting** (lists, headings, bullet points) for the content type
7. **Include important context** from the video that's relevant to their request

## Content Types and Direct Responses:

### For Recipes:
❌ **Bad**: "Here's the recipe from the video..."
✅ **Good**: "**Ingredients:**\n- 2 cups flour\n- 1 cup sugar..."

### For Tutorials/How-to:
❌ **Bad**: "I'll break down the tutorial for you..."
✅ **Good**: "**Step 1:** Open the software and create a new project..."

### For Educational Content:
❌ **Bad**: "The video covers several key concepts..."
✅ **Good**: "**Photosynthesis** is the process by which plants convert..."

### For General Summaries:
❌ **Bad**: "Here's a summary of the video content..."
✅ **Good**: "The video demonstrates three main techniques for..."

## Important Notes:
- If no transcript is available, use the video title, description, and your knowledge to provide the best possible response
- Be transparent about limitations when transcript is not available
- Focus on being helpful and practical rather than just summarizing

## User Instructions:
{systemInstructions}

Based on the user's request and the video content, provide the most helpful and relevant response starting immediately with the requested content.
`;

export async function POST(req: NextRequest) {
  const requestId = Date.now().toString(36);
  console.log(`=== YouTube API route called (ID: ${requestId}) ===`);
  try {
    const body: YouTubeSummaryBody = await req.json();
    const { url, chatHistory, chatModel, systemInstructions = '' } = body;

    // Validate YouTube URL
    if (!containsYouTubeLink(url)) {
      return Response.json(
        { error: 'Invalid YouTube URL provided' },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return Response.json(
        { error: 'Could not extract video ID from URL' },
        { status: 400 }
      );
    }

    // Extract video data and transcript
    console.log(`=== Extracting data for video: ${videoId} (ID: ${requestId}) ===`);
    const videoData = await extractYouTubeVideoData(videoId);
    if (!videoData) {
      return Response.json(
        { error: 'Could not extract video data. The video might be private, deleted, or not available. Please check the URL and try again.' },
        { status: 404 }
      );
    }

    // Check if we have basic video info
    if (!videoData.title || videoData.title === 'Unknown Title') {
      return Response.json(
        { error: 'Could not extract video information. The video might be restricted or unavailable.' },
        { status: 404 }
      );
    }

    console.log(`Video data extracted successfully: ${videoData.title}`);
    console.log(`Transcript segments: ${videoData.transcript.length}`);

    // Get chat model
    const chatModelProviders = await getAvailableChatModelProviders();
    const chatModelProvider = chatModelProviders[
      chatModel?.provider || Object.keys(chatModelProviders)[0]
    ];
    const model = chatModelProvider[
      chatModel?.name || Object.keys(chatModelProvider)[0]
    ];

    let llm: BaseChatModel | undefined;

    if (chatModel?.provider === 'custom_openai') {
      llm = new ChatOpenAI({
        openAIApiKey: getCustomOpenaiApiKey(),
        modelName: getCustomOpenaiModelName(),
        temperature: 0.7,
        configuration: {
          baseURL: getCustomOpenaiApiUrl(),
        },
      }) as unknown as BaseChatModel;
    } else if (model) {
      llm = model.model;
    }

    if (!llm) {
      return Response.json({ error: 'Invalid chat model' }, { status: 400 });
    }

    // Prepare transcript text
    const transcriptText = videoData.transcript
      .map(segment => `[${formatTimestamp(segment.start)}] ${segment.text}`)
      .join('\n');

    // Modify prompt based on transcript availability
    let finalPrompt = YouTubeSummaryPrompt;
    if (!transcriptText || videoData.transcript.length === 0) {
      finalPrompt = YouTubeSummaryPrompt.replace(
        '## Transcript:\n{transcript}\n',
        '## Transcript:\nNo transcript available for this video. Please provide a summary based on the video title, description, and any available metadata.\n'
      );
    }

    // Create prompt template
    const promptTemplate = PromptTemplate.fromTemplate(finalPrompt);

    // Generate summary
    const chain = promptTemplate.pipe(llm);
    const response = await chain.invoke({
      title: videoData.title,
      channel: videoData.channel,
      duration: videoData.duration,
      viewCount: videoData.viewCount,
      publishedAt: videoData.publishedAt,
      description: videoData.description,
      transcript: transcriptText || 'No transcript available',
      systemInstructions,
    });

    const hasTranscript = videoData.transcript.length > 0;
    const transcriptStatus = hasTranscript 
      ? `Transcript available (${videoData.transcript.length} segments)`
      : 'No transcript available - summary based on video metadata';

    return Response.json({
      summary: response.content,
      videoInfo: {
        title: videoData.title,
        channel: videoData.channel,
        duration: videoData.duration,
        viewCount: videoData.viewCount,
        publishedAt: videoData.publishedAt,
        thumbnail: videoData.thumbnail,
        description: videoData.description,
        videoId: videoData.videoId,
        url,
      },
      hasTranscript,
      transcriptStatus,
      transcriptSegments: videoData.transcript.length,
    }, { status: 200 });

  } catch (error) {
    console.error('Error generating YouTube summary:', error);
    return Response.json(
      { error: 'Failed to generate video summary' },
      { status: 500 }
    );
  }
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
} 