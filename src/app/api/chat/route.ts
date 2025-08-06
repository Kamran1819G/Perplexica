import prompts from '@/lib/prompts';
import MetaSearchAgent from '@/lib/search/metaSearchAgent';
import crypto from 'crypto';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { EventEmitter } from 'stream';
import {
  chatModelProviders,
  embeddingModelProviders,
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '@/lib/providers';
import db from '@/lib/db';
import { chats, messages as messagesSchema } from '@/lib/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { getFileDetails } from '@/lib/utils/files';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { searchHandlers } from '@/lib/search';
import { containsYouTubeLink, extractYouTubeLinks } from '@/lib/utils/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Message = {
  messageId: string;
  chatId: string;
  content: string;
};

type ChatModel = {
  provider: string;
  name: string;
};

type EmbeddingModel = {
  provider: string;
  name: string;
};

type Body = {
  message: Message;
  optimizationMode: 'speed' | 'balanced' | 'quality';
  history: Array<[string, string]>;
  files: Array<string>;
  chatModel: ChatModel;
  embeddingModel: EmbeddingModel;
  systemInstructions: string;
};

const handleEmitterEvents = async (
  stream: EventEmitter,
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder,
  aiMessageId: string,
  chatId: string,
) => {
  let recievedMessage = '';
  let sources: any[] = [];

  stream.on('data', (data) => {
    const parsedData = JSON.parse(data);
    if (parsedData.type === 'response') {
      writer.write(
        encoder.encode(
          JSON.stringify({
            type: 'message',
            data: parsedData.data,
            messageId: aiMessageId,
          }) + '\n',
        ),
      );

      recievedMessage += parsedData.data;
    } else if (parsedData.type === 'sources') {
      writer.write(
        encoder.encode(
          JSON.stringify({
            type: 'sources',
            data: parsedData.data,
            messageId: aiMessageId,
          }) + '\n',
        ),
      );

      sources = parsedData.data;
    }
  });
  stream.on('end', () => {
    writer.write(
      encoder.encode(
        JSON.stringify({
          type: 'messageEnd',
          messageId: aiMessageId,
        }) + '\n',
      ),
    );
    writer.close();

    db.insert(messagesSchema)
      .values({
        content: recievedMessage,
        chatId: chatId,
        messageId: aiMessageId,
        role: 'assistant',
        metadata: JSON.stringify({
          createdAt: new Date(),
          ...(sources && sources.length > 0 && { sources }),
        }),
      })
      .execute();
  });
  stream.on('error', (data) => {
    const parsedData = JSON.parse(data);
    writer.write(
      encoder.encode(
        JSON.stringify({
          type: 'error',
          data: parsedData.data,
        }),
      ),
    );
    writer.close();
  });
};

const handleHistorySave = async (
  message: Message,
  humanMessageId: string,
  files: string[],
) => {
  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, message.chatId),
  });

  if (!chat) {
    await db
      .insert(chats)
      .values({
        id: message.chatId,
        title: message.content,
        createdAt: new Date().toString(),

        files: files.map(getFileDetails),
      })
      .execute();
  }

  const messageExists = await db.query.messages.findFirst({
    where: eq(messagesSchema.messageId, humanMessageId),
  });

  if (!messageExists) {
    await db
      .insert(messagesSchema)
      .values({
        content: message.content,
        chatId: message.chatId,
        messageId: humanMessageId,
        role: 'user',
        metadata: JSON.stringify({
          createdAt: new Date(),
        }),
      })
      .execute();
  } else {
    await db
      .delete(messagesSchema)
      .where(
        and(
          gt(messagesSchema.id, messageExists.id),
          eq(messagesSchema.chatId, message.chatId),
        ),
      )
      .execute();
  }
};

export const POST = async (req: Request) => {
  const requestId = Date.now().toString(36);
  console.log(`=== Chat API route called (ID: ${requestId}) ===`);
  try {
    const body = (await req.json()) as Body;
    const { message } = body;

    if (message.content === '') {
      return Response.json(
        {
          message: 'Please provide a message to process',
        },
        { status: 400 },
      );
    }

    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const chatModelProvider =
      chatModelProviders[
        body.chatModel?.provider || Object.keys(chatModelProviders)[0]
      ];
    const chatModel =
      chatModelProvider[
        body.chatModel?.name || Object.keys(chatModelProvider)[0]
      ];

    const embeddingProvider =
      embeddingModelProviders[
        body.embeddingModel?.provider || Object.keys(embeddingModelProviders)[0]
      ];
    const embeddingModel =
      embeddingProvider[
        body.embeddingModel?.name || Object.keys(embeddingProvider)[0]
      ];

    let llm: BaseChatModel | undefined;
    let embedding = embeddingModel.model;

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

    if (!embedding) {
      return Response.json(
        { error: 'Invalid embedding model' },
        { status: 400 },
      );
    }

    const humanMessageId =
      message.messageId ?? crypto.randomBytes(7).toString('hex');
    const aiMessageId = crypto.randomBytes(7).toString('hex');

    const history: BaseMessage[] = body.history.map((msg) => {
      if (msg[0] === 'human') {
        return new HumanMessage({
          content: msg[1],
        });
      } else {
        return new AIMessage({
          content: msg[1],
        });
      }
    });

    // Check for YouTube links in the message
    const youtubeLinks = extractYouTubeLinks(message.content);
    
    if (youtubeLinks.length > 0) {
      console.log(`=== Found ${youtubeLinks.length} YouTube links, processing... (ID: ${requestId}) ===`);
      
      // Process the first YouTube link found
      const youtubeUrl = youtubeLinks[0];
      
      try {
        // Call the YouTube API directly
        console.log(`=== Calling YouTube API for URL: ${youtubeUrl} (ID: ${requestId}) ===`);
        const url = new URL(req.url);
        const summaryResponse = await fetch(`${url.origin}/api/youtube`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: youtubeUrl,
            chatHistory: body.history.map(([role, content]) => ({ role, content })),
            chatModel: body.chatModel,
            systemInstructions: `${body.systemInstructions}\n\nUser's current request: ${message.content}`,
          }),
        });
        
        if (!summaryResponse.ok) {
          throw new Error('Failed to generate YouTube analysis');
        }
        
        const summaryData = await summaryResponse.json();
        console.log(`=== YouTube API response received, summary length: ${summaryData.summary?.length || 0} (ID: ${requestId}) ===`);
        
        // Create response stream
        const responseStream = new TransformStream();
        const writer = responseStream.writable.getWriter();
        const encoder = new TextEncoder();
        
        // Send the response based on user's request
        const responseTitle = message.content.toLowerCase().includes('recipe') ? 'YouTube Recipe' :
                             message.content.toLowerCase().includes('tutorial') ? 'YouTube Tutorial' :
                             message.content.toLowerCase().includes('how') ? 'YouTube How-to Guide' :
                             'YouTube Video Analysis';
        
        const responseData = `## ${responseTitle}\n\n**${summaryData.videoInfo.title}**\n\n*by ${summaryData.videoInfo.channel} • ${summaryData.videoInfo.duration} • ${summaryData.videoInfo.viewCount} views*\n\n${summaryData.summary}\n\n---\n*[Watch on YouTube](${youtubeUrl})*`;
        console.log(`=== Response data created, length: ${responseData.length} (ID: ${requestId}) ===`);
        
        // Send the complete response in one message with a special flag
        console.log(`=== Sending complete response (ID: ${requestId}) ===`);
        writer.write(
          encoder.encode(
            JSON.stringify({
              type: 'message',
              data: responseData,
              messageId: aiMessageId,
              isComplete: true, // Flag to indicate this is a complete response
            }) + '\n',
          ),
        );
        
        writer.write(
          encoder.encode(
            JSON.stringify({
              type: 'messageEnd',
              messageId: aiMessageId,
            }) + '\n',
          ),
        );
        
        writer.close();
        
        // Save to history
        handleHistorySave(message, humanMessageId, body.files);
        
        console.log(`YouTube processing completed successfully, returning response (ID: ${requestId})`);
        
        // Return the response and EXIT - no fallback to normal search
        return new Response(responseStream.readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache, no-transform',
          },
        });
        
      } catch (error) {
        console.error('Error processing YouTube link:', error);
        console.log('YouTube processing failed, will continue to normal search');
        // Continue to normal search if YouTube processing fails
      }
    }

    const handler = searchHandlers['webSearch'];

    const stream = await handler.searchAndAnswer(
      message.content,
      history,
      llm,
      embedding,
      body.optimizationMode,
      body.files,
      body.systemInstructions,
    );

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    handleEmitterEvents(stream, writer, encoder, aiMessageId, message.chatId);
            handleHistorySave(message, humanMessageId, body.files);

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err) {
    console.error('An error occurred while processing chat request:', err);
    return Response.json(
      { message: 'An error occurred while processing chat request' },
      { status: 500 },
    );
  }
};
