'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState, useMemo } from 'react';
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
import FollowUpQuestions from './FollowUpQuestions';
import SearchImages from './SearchImages';
import SearchVideos from './SearchVideos';
import { useSpeech } from 'react-text-to-speech';
import ThinkBox from './ThinkBox';
import SearchSteps from './SearchSteps';
import SearchStepper, { SearchProgressStep, SourcesProgressStep, BasicProgressStep } from './SearchStepper';
import SearchProgress from './SearchProgress';

const ThinkTagProcessor = ({ children }: { children: React.ReactNode }) => {
  return <ThinkBox content={children as string} />;
};



type TabType = 'answer' | 'images' | 'videos' | 'sources' | 'steps';

const StepsComponent = ({ 
  loading, 
  sources, 
  query,
  currentStep,
  steps,
  progress,
  mode = 'quick'
}: { 
  loading: boolean;
  sources?: any[];
  query: string;
  currentStep?: string;
  steps?: string[];
  progress?: {
    step: string;
    message: string;
    details: string;
    progress: number;
  };
  mode?: 'quick' | 'pro' | 'ultra';
}) => {
  // Convert sources to the format expected by SourcesStep
  const formattedSources = useMemo(() => sources?.map(source => ({
    title: source.metadata?.title || 'Untitled',
    url: source.metadata?.url || '',
    icon: `https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata?.url}&sz=16`
  })) || [], [sources]);

  // Define step progression mapping
  const stepProgression = useMemo((): Record<string, string> => ({
    // Search phase steps
    'planning': 'search',
    'pro_planning': 'search', 
    'ultra_planning': 'search',
    'query_generation': 'search',
    'ultra_query_generation': 'search',
    'queries_ready': 'search',
    'ultra_agents_init': 'search',
    'searching': 'search',
    'multi_search': 'search',
    'ultra_batch_search': 'search',
    'searching_query': 'search',
    'cross_validation': 'search',
    'dynamic_replan': 'search',
    
    // Sources phase steps
    'sources_found': 'sources',
    'query_results': 'sources', 
    'processing': 'sources',
    'ultra_processing': 'sources',
    
    // Generation phase steps
    'generating': 'generating',
    'ultra_generating': 'generating',
    'completing': 'generating',
    
    // Complete phase
    'complete': 'finished',
    'ultra_complete': 'finished'
  }), []);

  // Calculate current phase and steps
  const currentPhase = useMemo(() => {
    if (!progress) return 'search';
    return stepProgression[progress.step] || 'search';
  }, [progress, stepProgression]);

  // Calculate visible steps based on current phase and sources
  const visibleSteps = useMemo(() => {
    if (!loading && !progress) {
      return ['search', 'sources', 'generating', 'finished'];
    }

    const steps: string[] = [];
    
    // Always show search step
    steps.push('search');
    
    // Add sources step if we have sources or we're in sources phase or beyond
    if (formattedSources.length > 0 || ['sources', 'generating', 'finished'].includes(currentPhase)) {
      steps.push('sources');
    }
    
    // Add generating step if we're in generating phase or beyond
    if (['generating', 'finished'].includes(currentPhase)) {
      steps.push('generating');
    }
    
    // Add finished step if we're in finished phase or loading is complete
    if (currentPhase === 'finished' || !loading) {
      steps.push('finished');
    }
    
    return steps;
  }, [loading, progress, currentPhase, formattedSources.length]);

  // Calculate completed steps
  const completedSteps = useMemo(() => {
    if (!loading) {
      return [...visibleSteps];
    }

    const completed: string[] = [];
    
    // Complete search if we're past it
    if (['sources', 'generating', 'finished'].includes(currentPhase) || formattedSources.length > 0) {
      completed.push('search');
    }
    
    // Complete sources if we're past it
    if (['generating', 'finished'].includes(currentPhase)) {
      completed.push('sources');
    }
    
    // Complete generating if we're finished
    if (currentPhase === 'finished') {
      completed.push('generating');
    }
    
    // Complete finished if loading is done
    if (!loading) {
      completed.push('finished');
    }
    
    return completed;
  }, [loading, currentPhase, formattedSources.length, visibleSteps]);

  // Get progress for a specific step
  const getStepProgress = (stepName: string) => {
    if (!progress) return undefined;
    
    const stepMapping: Record<string, string[]> = {
      'search': ['planning', 'pro_planning', 'query_generation', 'queries_ready', 'searching', 'multi_search', 'searching_query'],
      'sources': ['sources_found', 'query_results', 'processing'],
      'generating': ['generating', 'completing'],
      'finished': ['complete']
    };
    
    const relevantSteps = stepMapping[stepName] || [];
    if (relevantSteps.includes(progress.step)) {
      return progress;
    }
    
    return undefined;
  };

  // Determine if step is active (currently running)
  const isStepActive = (stepName: string) => {
    if (!loading || !progress) return false;
    const stepProgress = getStepProgress(stepName);
    return stepProgress !== undefined && !completedSteps.includes(stepName);
  };

  // Determine if step is completed
  const isStepCompleted = (stepName: string) => {
    return completedSteps.includes(stepName);
  };

  // Calculate current step number for ProgressStepper
  const currentStepNumber = visibleSteps.length;

  return (
    <div className="w-full">
      <SearchStepper currentStep={currentStepNumber} mode={mode}>
        {visibleSteps.includes('search') && (
          <SearchProgressStep 
            query={query} 
            progress={getStepProgress('search')}
            mode={mode}
          />
        )}
        {visibleSteps.includes('sources') && (
          <SourcesProgressStep 
            sources={formattedSources}
            progress={getStepProgress('sources')}
            mode={mode}
          />
        )}
        {visibleSteps.includes('generating') && (
          <BasicProgressStep 
            progress={getStepProgress('generating')}
            isActive={isStepActive('generating')}
            isComplete={isStepCompleted('generating')}
            mode={mode}
          >
            Generating answer...
          </BasicProgressStep>
        )}
        {visibleSteps.includes('finished') && (
          <BasicProgressStep 
            progress={getStepProgress('finished')}
            isComplete={!loading || isStepCompleted('finished')}
            mode={mode}
          >
            Finished
          </BasicProgressStep>
        )}
      </SearchStepper>
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
  const [activeTab, setActiveTab] = useState<TabType>(
    loading && isLast ? 'steps' : 'answer'
  );
  const [showSteps, setShowSteps] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set(['answer']));
  const [availableTabs, setAvailableTabs] = useState<Set<TabType>>(new Set(['answer', 'steps']));

  // Determine the search mode based on message properties
  const getSearchMode = (): 'quick' | 'pro' | 'ultra' => {
    if (message.isOrchestrator) {
      // Check for ultra-specific properties
      if (message.progress?.step?.includes('ultra_') || 
          message.progress?.step?.includes('ultra_agents_init') ||
          message.progress?.step?.includes('ultra_batch_search') ||
          message.progress?.step?.includes('ultra_processing') ||
          message.progress?.step?.includes('ultra_generating') ||
          message.progress?.step?.includes('ultra_complete')) {
        return 'ultra';
      }
      // Check for pro-specific properties
      if (message.progress?.step?.includes('pro_') || 
          message.progress?.step?.includes('multi_search') ||
          message.progress?.step?.includes('query_generation') ||
          message.progress?.step?.includes('queries_ready')) {
        return 'pro';
      }
      // Default to quick for orchestrator messages
      return 'quick';
    }
    return 'quick';
  };

  const searchMode = getSearchMode();

  // Convert sources to the format expected by SearchProgress
  const formattedSources = useMemo(() => message.sources?.map(source => ({
    title: source.metadata?.title || 'Untitled',
    url: source.metadata?.url || '',
    icon: `https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata?.url}&sz=16`
  })) || [], [message.sources]);

  // Convert agents data if available
  const agents = useMemo(() => {
    if (message.agents) {
      return message.agents.map((agent, index) => ({
        id: agent.id || `agent-${index + 1}`,
        status: agent.status || 'pending',
        query: agent.query || '',
        results: agent.results || 0
      }));
    }
    return [];
  }, [message.agents]);

  // Track content availability and manage tab visibility
  useEffect(() => {
    const newAvailableTabs = new Set<TabType>();
    
    // Always show steps tab
    newAvailableTabs.add('steps');
    
    // Always show answer tab for assistant messages or when not loading
    if (message.role === 'assistant') {
      newAvailableTabs.add('answer');
    }
    
    // Show sources tab when sources are available
    if (message.sources && message.sources.length > 0) {
      newAvailableTabs.add('sources');
    }
    
    // For assistant messages, show images/videos tabs (they will load content dynamically)
    if (message.role === 'assistant') {
      newAvailableTabs.add('images');
      newAvailableTabs.add('videos');
      if (!loading) {
        setLoadedTabs(prev => new Set([...prev, 'images', 'videos']));
      }
    }
    
    setAvailableTabs(newAvailableTabs);
  }, [message.sources, message.role, loading, isLast]);

  // Show steps when loading starts, redirect to answer when complete
  useEffect(() => {
    if (loading && isLast) {
      setShowSteps(true);
      setActiveTab('steps');
    } else if (!loading && showSteps && message.role === 'assistant') {
      // When loading completes, switch to answer tab after a brief delay
      setTimeout(() => {
        setShowSteps(false);
        setActiveTab('answer');
      }, 1000);
    }
  }, [loading, isLast, showSteps, message.role]);

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
                  className="text-[#24A0ED] animate-spin"
                  size={20}
                />
                <span className="text-black dark:text-white">Generating answer...</span>
              </div>
            ) : (
              <>
                <Markdown
                  className={cn(
                    'prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-6 prose-h2:font-[800] prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:font-[600] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400]',
                    'max-w-none break-words text-black dark:text-white',
                  )}
                  options={markdownOverrides}
                >
                  {parsedMessage}
                </Markdown>

                {/* Follow-up Questions */}
                {!loading && (message.followUpQuestions || message.relatedQueries) && (
                  <FollowUpQuestions
                    followUpQuestions={message.followUpQuestions}
                    relatedQueries={message.relatedQueries}
                    onQuestionSelect={sendMessage}
                    className="mt-6"
                  />
                )}
                

                {/* Important Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Network size={16} className="text-black/70 dark:text-white/70" />
                      <h3 className="text-sm font-medium text-black dark:text-white">Sources</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {message.sources.slice(0, 4).map((source, index) => (
                        <a
                          key={index}
                          href={source.metadata?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start space-x-3 p-3 bg-light-secondary/50 dark:bg-dark-secondary/50 border border-light-secondary dark:border-dark-secondary rounded-lg hover:bg-light-secondary dark:hover:bg-dark-secondary transition-all duration-200"
                        >
                          <div className="w-8 h-8 rounded-md bg-light-secondary dark:bg-dark-secondary flex items-center justify-center border border-light-secondary dark:border-dark-secondary flex-shrink-0">
                            <img
                              src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata?.url}&sz=16`}
                              alt=""
                              className="w-4 h-4 rounded-sm"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-4 h-4 bg-gray-600/50 rounded-sm"></div>';
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-black dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {source.metadata?.title || 'Untitled'}
                            </div>
                            <div className="text-xs text-black/60 dark:text-white/60 truncate mt-1">
                              {source.metadata?.url?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-black/40 dark:text-white/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                    {message.sources.length > 4 && (
                      <button
                        onClick={() => setActiveTab('sources')}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        View all {message.sources.length} sources →
                      </button>
                    )}
                  </div>
                )}
              </>
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
                key={`images-${message.messageId}`}
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
                key={`videos-${message.messageId}`}
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
            {message.isOrchestrator && message.orchestratorSteps ? (
              <SearchSteps 
                steps={message.orchestratorSteps}
                isVisible={true}
                mode={searchMode}
                progress={message.progress}
              />
            ) : loading && isLast ? (
              <SearchProgress
                mode={searchMode}
                progress={message.progress}
                agents={agents}
                sources={formattedSources}
                isVisible={true}
              />
            ) : (
              <StepsComponent 
                loading={loading && isLast}
                sources={message.sources}
                query={message.role === 'user' ? message.content : (history[messageIndex - 1]?.content || '')}
                currentStep={message.currentStep}
                steps={message.steps}
                progress={message.progress}
                mode={searchMode}
              />
            )}
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
                  
                  // Only show tabs that are available
                  if (!availableTabs.has(tab.id)) return null;
                  
                  return (
                    <button
                      key={tab.id}
                      data-tab={tab.id}
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
