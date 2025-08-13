import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage } from '@langchain/core/messages';

export interface SearchIntent {
  needsImages: boolean;
  needsVideos: boolean;
  confidence: {
    images: number;
    videos: number;
  };
  reasoning: string;
  primaryIntent: 'documents' | 'images' | 'videos' | 'mixed';
}

export class IntentDetector {
  private static readonly INTENT_DETECTION_PROMPT = `You are an intelligent search intent analyzer. Analyze the user query and determine what types of content would be most helpful.

Consider these factors:
- **Text/Documents**: General information, research, explanations, analysis, news, facts
- **Images**: Visual content, photos, diagrams, charts, artwork, screenshots, examples
- **Videos**: Tutorials, demonstrations, entertainment, lectures, reviews, how-to content

Query: "{query}"

Respond with a JSON object containing:
{
  "needsImages": boolean,
  "needsVideos": boolean,
  "confidence": {
    "images": number (0-1),
    "videos": number (0-1)
  },
  "reasoning": "Brief explanation of your analysis",
  "primaryIntent": "documents" | "images" | "videos" | "mixed"
}

Examples:
- "How to bake a chocolate cake" → needs images and videos (visual guide and demonstration)
- "Latest news about climate change" → some images for charts/graphs
- "Show me pictures of golden retrievers" → primarily images
- "Tutorial on React hooks" → videos (tutorials are often video-based)
- "What is quantum computing" → some images for diagrams
- "Give me image of Tanmay Bhat" → primarily images
- "Who is Tanmay Bhat" → images (person info benefits from photos)

Analyze the query and respond with valid JSON only.`;

  constructor(private llm: BaseChatModel) {}

  async detectIntent(query: string): Promise<SearchIntent> {
    if (!query || query.trim().length === 0) {
      return IntentDetector.getQuickIntent(query);
    }

    try {
      return await this.getLLMIntent(query);
    } catch (error) {
      console.error('LLM intent detection failed:', error);
      console.log('Falling back to heuristic intent detection');
      return IntentDetector.getQuickIntent(query);
    }
  }

  private async getLLMIntent(query: string): Promise<SearchIntent> {
    if (!this.llm) {
      throw new Error('LLM not initialized');
    }

    const prompt = IntentDetector.INTENT_DETECTION_PROMPT.replace('{query}', query);
    
    try {
      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      const content = response.content as string;
      
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const intent = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (typeof intent.needsImages !== 'boolean' ||
          typeof intent.needsVideos !== 'boolean') {
        throw new Error('Invalid response structure');
      }

      return {
        needsImages: intent.needsImages,
        needsVideos: intent.needsVideos,
        confidence: {
          images: intent.confidence?.images || 0.5,
          videos: intent.confidence?.videos || 0.5
        },
        reasoning: intent.reasoning || 'LLM-based analysis',
        primaryIntent: intent.primaryIntent || 'mixed'
      };
    } catch (error) {
      console.error('Error parsing LLM intent response:', error);
      throw error;
    }
  }

  static getQuickIntent(query: string): SearchIntent {
    const queryLower = query.toLowerCase();
    
    // Enhanced keyword sets for better detection
    const imageKeywords = [
      'image', 'images', 'picture', 'pictures', 'photo', 'photos', 'pic', 'pics',
      'show me', 'visual', 'see', 'look', 'appearance', 'diagram', 'chart',
      'screenshot', 'artwork', 'gallery', 'visualization', 'infographic',
      'portrait', 'face', 'looks like', 'what does', 'appearance of'
    ];
    
    const videoKeywords = [
      'video', 'videos', 'watch', 'tutorial', 'how to', 'demonstration',
      'lesson', 'course', 'lecture', 'review', 'gameplay', 'movie',
      'documentary', 'interview', 'presentation', 'webinar', 'stream',
      'clip', 'footage', 'recording', 'show me how', 'teach me'
    ];
    
    const documentKeywords = [
      'what is', 'explain', 'definition', 'research', 'study', 'analysis',
      'news', 'article', 'report', 'statistics', 'facts', 'information',
      'compare', 'vs', 'versus', 'difference', 'history', 'timeline',
      'who is', 'biography', 'background', 'details', 'about'
    ];

    let imageScore = 0;
    let videoScore = 0;
    let documentScore = 0;

    // Calculate scores based on keyword matches
    imageKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) {
        imageScore += 1;
        // Give extra weight to explicit image requests
        if (['image', 'images', 'picture', 'pictures', 'photo', 'photos', 'show me'].includes(keyword)) {
          imageScore += 1;
        }
      }
    });
    
    videoKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) {
        videoScore += 1;
        // Give extra weight to explicit video requests
        if (['video', 'videos', 'tutorial', 'how to', 'watch'].includes(keyword)) {
          videoScore += 1;
        }
      }
    });
    
    documentKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) documentScore += 1;
    });

    // Special handling for person queries - they often benefit from images
    const personKeywords = ['who is', 'biography', 'about'];
    const isPersonQuery = personKeywords.some(keyword => queryLower.includes(keyword));
    if (isPersonQuery) {
      imageScore += 1; // Boost image score for person queries
    }

    // Normalize scores
    const maxScore = Math.max(imageScore, videoScore, documentScore, 1);
    const imageConfidence = Math.min(imageScore / maxScore, 1);
    const videoConfidence = Math.min(videoScore / maxScore, 1);
    const documentConfidence = Math.min(documentScore / maxScore, 1);

    // Determine what's needed based on confidence thresholds
    const needsImages = imageConfidence > 0.3;
    const needsVideos = videoConfidence > 0.3;

    let primaryIntent: SearchIntent['primaryIntent'] = 'documents';
    if (imageConfidence > videoConfidence && imageConfidence > documentConfidence) {
      primaryIntent = 'images';
    } else if (videoConfidence > documentConfidence && videoConfidence > imageConfidence) {
      primaryIntent = 'videos';
    } else if (imageConfidence > 0.3 || videoConfidence > 0.3) {
      primaryIntent = 'mixed';
    }

    const reasoning = `Heuristic analysis: image keywords (${imageScore}), video keywords (${videoScore}), document keywords (${documentScore})`;

    return {
      needsImages,
      needsVideos,
      confidence: {
        images: imageConfidence,
        videos: videoConfidence
      },
      reasoning,
      primaryIntent
    };
  }
}

