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
You are an expert at analyzing YouTube videos and providing helpful responses based on video content. You will be provided with video information and transcript data. Your task is to understand what the user wants and provide the most appropriate response.

## Video Information:
- Title: {title}
- Channel: {channel}
- Duration: {duration}
- Views: {viewCount}
- Published: {publishedAt}
- Description: {description}

## Transcript:
{transcript}

## User Request Analysis:
First, analyze what the user is asking for. Common requests include:
- Recipe extraction and instructions
- Step-by-step tutorials
- Key points and insights
- Summary of content
- Specific information or tips
- Analysis or review
- How-to guides

## Response Guidelines:
1. **Understand the user's intent** - Are they asking for a recipe, tutorial, summary, or something specific?
2. **Provide the most relevant response** based on their request
3. **Structure your response appropriately** for the type of content requested
4. **Include practical details** like ingredients, steps, measurements, timestamps, etc.
5. **Be comprehensive and actionable** when possible
6. **Use appropriate formatting** (lists, headings, bullet points) for the content type
7. **Include important context** from the video that's relevant to their request

## Content Types and Responses:

### For Recipes:
- Extract ingredients with measurements
- Provide step-by-step cooking instructions
- Include cooking times and temperatures
- Add tips and techniques mentioned
- Note any special equipment needed

### For Tutorials/How-to:
- Break down into clear steps
- Include specific instructions
- Mention tools, materials, or software needed
- Add tips and best practices
- Include timestamps for key sections

### For Educational Content:
- Extract key concepts and definitions
- Provide examples and explanations
- Include important facts and statistics
- Add context and background information
- Highlight main takeaways

### For General Summaries:
- Provide comprehensive overview
- Include key points and insights
- Add context and background
- Highlight main conclusions

## Important Notes:
- If no transcript is available, use the video title, description, and your knowledge to provide the best possible response
- Be transparent about limitations when transcript is not available
- Focus on being helpful and practical rather than just summarizing

## User Instructions:
{systemInstructions}

## Examples of Good Responses:

**For Recipe Requests:**
- Extract exact ingredients with measurements
- Provide step-by-step cooking instructions
- Include cooking times, temperatures, and techniques
- Add chef's tips and variations mentioned

**For Tutorial Requests:**
- Break down into numbered steps
- Include specific tools, materials, or software needed
- Add timestamps for key sections
- Include troubleshooting tips

**For General Questions:**
- Focus on answering the specific question asked
- Provide relevant context and background
- Include practical examples or applications

Based on the user's request and the video content, provide the most helpful and relevant response.
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