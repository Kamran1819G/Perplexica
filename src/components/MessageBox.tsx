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
  Search,
  CheckCircle,
  Clock,
  ExternalLink,
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

type StepStatus = 'pending' | 'active' | 'completed';

interface Step {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
  icon?: React.ReactNode;
  details?: string[];
}

const StepsComponent = ({ 
  loading, 
  sources, 
  query,
  currentStep,
  steps
}: { 
  loading: boolean;
  sources?: any[];
  query: string;
  currentStep?: string;
  steps?: string[];
}) => {
  // Dynamic step generation based on current state
  const generateSteps = (): Step[] => {
    const baseSteps = [
      {
        id: 'search',
        title: 'Searching the web',
        status: 'pending' as StepStatus,
      },
      {
        id: 'refine',
        title: 'Refining search',
        description: query,
        status: 'pending' as StepStatus,
      },
      {
        id: 'read',
        title: `Reading sources${sources && sources.length > 0 ? ` - ${sources.length}` : ''}`,
        status: 'pending' as StepStatus,
      },
      {
        id: 'generate',
        title: 'Generating answer',
        status: 'pending' as StepStatus,
      },
      {
        id: 'complete',
        title: 'Finished',
        status: 'pending' as StepStatus,
      },
    ];

    // Update step statuses based on current state
    return baseSteps.map(step => {
      if (currentStep && steps) {
        if (steps.includes(step.id)) {
          return { ...step, status: 'completed' as StepStatus };
        } else if (step.id === currentStep) {
          return { ...step, status: 'active' as StepStatus };
        }
      }
      return step;
    });
  };

  const [stepStates, setStepStates] = useState<Step[]>(generateSteps());
  const [visibleSteps, setVisibleSteps] = useState<number>(1);

  // Update steps when props change
  useEffect(() => {
    const newSteps = generateSteps();
    setStepStates(newSteps);
    
    // Update visible steps
    if (loading) {
      if (currentStep && steps) {
        const stepIndex = newSteps.findIndex(step => step.id === currentStep);
        setVisibleSteps(Math.max(stepIndex + 1, visibleSteps));
      } else {
        // Simulate progression if no real data
        setVisibleSteps(1);
        const timers = [
          setTimeout(() => setVisibleSteps(2), 1000),
          setTimeout(() => setVisibleSteps(3), 2000),
          setTimeout(() => setVisibleSteps(4), 3000),
        ];
        return () => timers.forEach(timer => clearTimeout(timer));
      }
    } else {
      setVisibleSteps(newSteps.length);
    }
  }, [loading, currentStep, steps, query]);

  const getStepIcon = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle size={14} className="text-white" />;
      case 'active':
        return <Clock size={14} className="text-white animate-pulse" />;
      default:
        return step.icon || <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const getStepColor = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return 'text-gray-300';
      case 'active':
        return 'text-gray-300';
      default:
        return 'text-gray-400';
    }
  };

  const getStepBackground = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return 'bg-gray-800 border-gray-700';
      case 'active':
        return 'bg-gray-800 border-gray-700';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

    return (
    <div className="flex flex-col space-y-4">
      {/* Timeline Steps */}
      <div className="relative">
        {stepStates.slice(0, visibleSteps).map((step, index) => (
          <div key={step.id} className="relative mb-6">
            {/* Step Icon - Simple dot for all steps */}
            <div className="absolute left-3 top-2 w-3 h-3 rounded-full bg-gray-600"></div>
            
            {/* Step Content */}
            <div className="ml-8">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-gray-300">
                  {step.title}
                </span>
              </div>
              
              {/* Search Query Box */}
              {step.id === 'refine' && step.description && (
                <div className="ml-4 mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Search size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-400 font-mono">{step.description}</span>
                  </div>
                </div>
              )}
              
              {/* Sources Reading Section */}
              {step.id === 'read' && sources && sources.length > 0 && (
                <div className="ml-4 mt-3 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {sources.slice(0, 8).map((source, i) => (
                      <div key={i} className="flex items-center space-x-3 p-2 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                          <img
                            src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata?.url}&sz=16`}
                            alt="favicon"
                            className="w-4 h-4 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-300 truncate">
                            {source.metadata?.title || 'Untitled'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {source.metadata?.url?.replace(/.+\/\/|www.|\..+/g, '')}
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-gray-500 flex-shrink-0" />
                      </div>
                    ))}
                    {sources.length > 8 && (
                      <div className="text-center py-1">
                        <span className="text-xs text-gray-500">
                          ... and {sources.length - 8} more sources
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [showSteps, setShowSteps] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set(['answer']));

  // Show steps when loading starts, hide when complete
  useEffect(() => {
    if (loading && isLast) {
      setShowSteps(true);
      setActiveTab('steps');
    } else if (!loading && showSteps) {
      // Keep steps visible for a moment, then switch to answer
      setTimeout(() => {
        setShowSteps(false);
        setActiveTab('answer');
      }, 1000);
    }
  }, [loading, isLast, showSteps]);

  // Preload search components when message is rendered
  useEffect(() => {
    if (message.role === 'assistant' && !loading) {
      // Preload images and videos tabs to reduce delay when clicked
      setLoadedTabs(prev => new Set([...prev, 'images', 'videos']));
    }
  }, [message.role, loading]);

  // Show timeline steps for the last user message when loading
  const shouldShowSteps = (loading && isLast && message.role === 'user') || 
                         (message.role === 'assistant' && showSteps);

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
            {loadedTabs.has('images') && (
              <SearchImages
                query={history[messageIndex - 1]?.content || ''}
                chatHistory={history.slice(0, messageIndex - 1)}
                messageId={message.messageId}
              />
            )}
          </div>
        );
      case 'videos':
        return (
          <div className="flex flex-col space-y-4">
            {loadedTabs.has('videos') && (
              <SearchVideos
                chatHistory={history.slice(0, messageIndex - 1)}
                query={history[messageIndex - 1]?.content || ''}
                messageId={message.messageId}
              />
            )}
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
            <StepsComponent 
              loading={loading && isLast}
              sources={message.sources}
              query={message.role === 'user' ? message.content : (history[messageIndex - 1]?.content || '')}
              currentStep={message.currentStep}
              steps={message.steps}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      (activeTab === 'images' || activeTab === 'videos') && "-mx-4 md:-mx-8"
    )}>
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

      {(message.role === 'assistant' || shouldShowSteps) && (
        <div className={cn(
          "flex flex-col space-y-9 lg:space-y-0 lg:flex-row lg:justify-between lg:space-x-9",
          (activeTab === 'images' || activeTab === 'videos') && "lg:flex-col lg:space-x-0"
        )}>
          <div
            ref={dividerRef}
            className={cn(
              "flex flex-col space-y-6 w-full",
              (activeTab === 'images' || activeTab === 'videos') ? "lg:w-full" : "lg:w-9/12"
            )}
          >
            {/* Tabbed Interface */}
            <div className="flex flex-col space-y-4">
              {/* Tab Navigation */}
              <div className="flex flex-row space-x-1 border-b border-light-secondary dark:border-dark-secondary">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isStepsTab = tab.id === 'steps';
                  const shouldShowTab = isStepsTab || (!loading || !isLast || message.role === 'assistant');
                  
                  if (!shouldShowTab) return null;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setLoadedTabs(prev => new Set([...prev, tab.id]));
                      }}
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
              <div className={cn(
                "min-h-[200px]",
                (activeTab === 'images' || activeTab === 'videos') && "w-full"
              )}>
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
