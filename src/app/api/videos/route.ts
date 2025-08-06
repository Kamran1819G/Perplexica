import handleVideoSearch from '@/lib/chains/videoSearchAgent';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { getAvailableChatModelProviders } from '@/lib/providers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

interface ChatModel {
  provider: string;
  model: string;
}

interface VideoSearchBody {
  query: string;
  chatHistory: any[];
  page?: number;
  chatModel?: ChatModel;
}

// Only SearxNG is used for video search. YouTube Data API is NOT used.
export const POST = async (req: Request) => {
  try {
    const body: VideoSearchBody = await req.json();

    const chatHistory = body.chatHistory
      .map((msg: any) => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content);
        } else if (msg.role === 'assistant') {
          return new AIMessage(msg.content);
        }
      })
      .filter((msg) => msg !== undefined) as BaseMessage[];

    const chatModelProviders = await getAvailableChatModelProviders();

    const chatModelProvider =
      chatModelProviders[
        body.chatModel?.provider || Object.keys(chatModelProviders)[0]
      ];
    const chatModel =
      chatModelProvider[
        body.chatModel?.model || Object.keys(chatModelProvider)[0]
      ];

    let llm: BaseChatModel | undefined;

    if (body.chatModel?.provider === 'custom_openai') {
      llm = new ChatOpenAI({
        openAIApiKey: getCustomOpenaiApiKey(),
        modelName: getCustomOpenaiModelName(),
        temperature: 0.7,
        configuration: {
          baseURL: getCustomOpenaiApiUrl(),
        },
      }) as unknown as BaseChatModel;
    } else if (chatModelProvider && chatModel) {
      llm = chatModel.model;
    }

    if (!llm) {
      return Response.json({ error: 'Invalid chat model' }, { status: 400 });
    }

    const result = await handleVideoSearch(
      {
        chat_history: chatHistory,
        query: body.query,
        page: body.page,
      },
      llm,
    );

    // Handle both old format (array) and new format (object with videos and total)
    const videos = Array.isArray(result) ? result : (result.videos || []);
    const total = Array.isArray(result) ? result.length : (result.total || videos.length);

    if (!videos || videos.length === 0) {
      return Response.json({
        message: 'No real-time video results found. SearxNG may be rate-limited, blocked, or the query returned no results.',
        videos: [],
        total: 0
      }, { status: 200 });
    }

    return Response.json({ videos, total }, { status: 200 });
  } catch (err) {
    console.error(`An error occurred while searching videos: ${err}`);
    return Response.json(
      { message: 'An error occurred while searching videos' },
      { status: 500 },
    );
  }
};
