'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState } from 'react';
import { Message } from './ChatWindow';
import { cn } from '@/lib/utils';
import {
  BookCopy,
  Disc3,
  Volume2,
  StopCircle,
  Layers3,
  Plus,
  Sparkles,
  Image as ImageIcon,
  Network,
  List,
  Video,
} from 'lucide-react';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import Export from './MessageActions/Export';
import MessageSources from './MessageSources';
import SearchImages from './SearchImages';
import SearchVideos from './SearchVideos';
import { useSpeech } from 'react-text-to-speech';
import ThinkBox from './ThinkBox';

const ThinkTagProcessor = ({ children }: { children: React.ReactNode }) => {
  return <ThinkBox content={children as string} />;
};

type TabType = 'answer' | 'images' | 'videos' | 'sources' | 'steps';

const MessageBox = ({
  message,
  messageIndex,
  history,
  loading,
  dividerRef,
  isLast,
  rewrite,
  sendMessage,
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading: boolean;
  dividerRef?: MutableRefObject<HTMLDivElement | null>;
  isLast: boolean;
  rewrite: (messageId: string) => void;
  sendMessage: (message: string) => void;
}) => {
  const [parsedMessage, setParsedMessage] = useState(message.content);
  const [speechMessage, setSpeechMessage] = useState(message.content);
  const [activeTab, setActiveTab] = useState<TabType>('answer');

  useEffect(() => {
    const citationRegex = /\[([^\]]+)\]/g;
    const regex = /\[(\d+)\]/g;
    let processedMessage = message.content;

    if (message.role === 'assistant' && message.content.includes('<think>')) {
      const openThinkTag = processedMessage.match(/<think>/g)?.length || 0;
      const closeThinkTag = processedMessage.match(/<\/think>/g)?.length || 0;

      if (openThinkTag > closeThinkTag) {
        processedMessage += '</think> <a> </a>'; // The extra <a> </a> is to prevent the the think component from looking bad
      }
    }

    if (
      message.role === 'assistant' &&
      message?.sources &&
      message.sources.length > 0
    ) {
      setParsedMessage(
        processedMessage.replace(
          citationRegex,
          (_, capturedContent: string) => {
            const numbers = capturedContent
              .split(',')
              .map((numStr) => numStr.trim());

            const linksHtml = numbers
              .map((numStr) => {
                const number = parseInt(numStr);

                if (isNaN(number) || number <= 0) {
                  return `[${numStr}]`;
                }

                const source = message.sources?.[number - 1];
                const url = source?.metadata?.url;

                if (url) {
                  return `<a href="${url}" target="_blank" className="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative">${numStr}</a>`;
                } else {
                  return `[${numStr}]`;
                }
              })
              .join('');

            return linksHtml;
          },
        ),
      );
      setSpeechMessage(message.content.replace(regex, ''));
      return;
    }

    setSpeechMessage(message.content.replace(regex, ''));
    setParsedMessage(processedMessage);
  }, [message.content, message.sources, message.role]);

  const { speechStatus, start, stop } = useSpeech({ text: speechMessage });

  const markdownOverrides: MarkdownToJSX.Options = {
    overrides: {
      think: {
        component: ThinkTagProcessor,
      },
    },
  };

  const tabs = [
    {
      id: 'answer' as TabType,
      label: 'Answer',
      icon: Sparkles,
      count: null,
    },
    {
      id: 'images' as TabType,
      label: 'Images',
      icon: ImageIcon,
      count: null,
    },
    {
      id: 'videos' as TabType,
      label: 'Videos',
      icon: Video,
      count: null,
    },
    {
      id: 'sources' as TabType,
      label: 'Sources',
      icon: Network,
      count: message.sources?.length || 0,
    },
    {
      id: 'steps' as TabType,
      label: 'Steps',
      icon: List,
      count: null,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'answer':
        return (
          <div className="flex flex-col space-y-6">
            {loading && isLast ? (
              <div className="flex flex-row items-center space-x-2">
                <Disc3
                  className="text-black dark:text-white animate-spin"
                  size={20}
                />
                <span className="text-black dark:text-white">Generating answer...</span>
              </div>
            ) : (
              <Markdown
                className={cn(
                  'prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-6 prose-h2:font-[800] prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:font-[600] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400]',
                  'max-w-none break-words text-black dark:text-white',
                )}
                options={markdownOverrides}
              >
                {parsedMessage}
              </Markdown>
            )}
            {loading && isLast ? null : (
              <div className="flex flex-row items-center justify-between w-full text-black dark:text-white py-4 -mx-2">
                <div className="flex flex-row items-center space-x-1">
                  <Rewrite rewrite={rewrite} messageId={message.messageId} />
                </div>
                <div className="flex flex-row items-center space-x-1">
                  <Export initialMessage={message.content} message={message} />
                  <Copy initialMessage={message.content} message={message} />
                  <button
                    onClick={() => {
                      if (speechStatus === 'started') {
                        stop();
                      } else {
                        start();
                      }
                    }}
                    className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
                  >
                    {speechStatus === 'started' ? (
                      <StopCircle size={18} />
                    ) : (
                      <Volume2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            )}
            {isLast &&
              message.suggestions &&
              message.suggestions.length > 0 &&
              message.role === 'assistant' &&
              !loading && (
                <>
                  <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                  <div className="flex flex-col space-y-3 text-black dark:text-white">
                    <div className="flex flex-row items-center space-x-2 mt-4">
                      <Layers3 />
                      <h3 className="text-xl font-medium">Related</h3>
                    </div>
                    <div className="flex flex-col space-y-3">
                      {message.suggestions.map((suggestion, i) => (
                        <div
                          className="flex flex-col space-y-3 text-sm"
                          key={i}
                        >
                          <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                          <div
                            onClick={() => {
                              sendMessage(suggestion);
                            }}
                            className="cursor-pointer flex flex-row justify-between font-medium space-x-2 items-center"
                          >
                            <p className="transition duration-200 hover:text-[#24A0ED]">
                              {suggestion}
                            </p>
                            <Plus
                              size={20}
                              className="text-[#24A0ED] flex-shrink-0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
          </div>
        );
      case 'images':
        return (
          <div className="flex flex-col space-y-4">
            <SearchImages
              query={history[messageIndex - 1]?.content || ''}
              chatHistory={history.slice(0, messageIndex - 1)}
              messageId={message.messageId}
            />
          </div>
        );
      case 'videos':
        return (
          <div className="flex flex-col space-y-4">
            <SearchVideos
              chatHistory={history.slice(0, messageIndex - 1)}
              query={history[messageIndex - 1]?.content || ''}
              messageId={message.messageId}
            />
          </div>
        );
      case 'sources':
        return (
          <div className="flex flex-col space-y-4">
            {message.sources && message.sources.length > 0 ? (
              <MessageSources sources={message.sources} />
            ) : (
              <p className="text-black/70 dark:text-white/70">No sources available</p>
            )}
          </div>
        );
      case 'steps':
        return (
          <div className="flex flex-col space-y-4">
            <p className="text-black/70 dark:text-white/70">Steps functionality coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {message.role === 'user' && (
        <div
          className={cn(
            'w-full',
            messageIndex === 0 ? 'pt-16' : 'pt-8',
            'break-words',
          )}
        >
          <h2 className="text-black dark:text-white font-medium text-3xl lg:w-9/12">
            {message.content}
          </h2>
        </div>
      )}

      {message.role === 'assistant' && (
        <div className="flex flex-col space-y-9 lg:space-y-0 lg:flex-row lg:justify-between lg:space-x-9">
          <div
            ref={dividerRef}
            className="flex flex-col space-y-6 w-full lg:w-9/12"
          >
            {/* Tabbed Interface */}
            <div className="flex flex-col space-y-4">
              {/* Tab Navigation */}
              <div className="flex flex-row space-x-1 border-b border-light-secondary dark:border-dark-secondary">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex flex-row items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-200',
                        activeTab === tab.id
                          ? 'text-black dark:text-white border-b-2 border-[#24A0ED]'
                          : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
                      )}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                      {tab.count !== null && tab.count > 0 && (
                        <span className="bg-light-secondary dark:bg-dark-secondary px-2 py-0.5 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="min-h-[200px]">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBox;
