import React, { ReactNode, useRef, useEffect, useState } from "react";
import { 
  Search, 
  Database, 
  Brain, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Layers,
  Sparkles,
  Target,
  Globe,
  BookOpen,
  FileText,
  Cpu,
  Network,
  Shield,
  BarChart3,
  Lightbulb,
  Rocket,
  ExternalLink
} from "lucide-react";

interface SearchStepperProps {
  children: ReactNode;
  className?: string;
  currentStep?: number;
  mode?: 'quick' | 'pro' | 'ultra';
}

interface StepProps {
  children: ReactNode;
  isActive?: boolean;
  isCompleted?: boolean;
  className?: string;
  stepNumber?: number;
  currentStep?: number;
}

interface SearchStepProps {
  query: string;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  stepNumber?: number;
  currentStep?: number;
  progress?: {
    step: string;
    message: string;
    details: string;
    progress: number;
  };
  mode?: 'quick' | 'pro' | 'ultra';
}

interface SourcesStepProps {
  sources: Array<{
    title: string;
    url: string;
    icon?: string;
  }>;
  maxVisible?: number;
  stepNumber?: number;
  currentStep?: number;
  progress?: {
    step: string;
    message: string;
    details: string;
    progress: number;
  };
  mode?: 'quick' | 'pro' | 'ultra';
}

interface AgentStepProps {
  agents?: Array<{
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    query: string;
    results: number;
  }>;
  progress?: {
    step: string;
    message: string;
    details: string;
    progress: number;
  };
  mode?: 'quick' | 'pro' | 'ultra';
}

const getModeConfig = (mode: 'quick' | 'pro' | 'ultra' = 'quick') => {
  switch (mode) {
    case 'quick':
      return {
        color: 'blue',
        accentColor: '#24A0ED',
        bgColor: 'bg-light-secondary dark:bg-dark-secondary',
        borderColor: 'border-light-secondary dark:border-dark-secondary',
        textColor: 'text-black dark:text-white',
        icon: Search,
        name: 'Quick Search',
        description: 'Fast and efficient search'
      };
    case 'pro':
      return {
        color: 'purple',
        accentColor: '#8B5CF6',
        bgColor: 'bg-light-secondary dark:bg-dark-secondary',
        borderColor: 'border-light-secondary dark:border-dark-secondary',
        textColor: 'text-black dark:text-white',
        icon: Brain,
        name: 'Pro Search',
        description: 'Comprehensive research analysis'
      };
    case 'ultra':
      return {
        color: 'emerald',
        accentColor: '#10B981',
        bgColor: 'bg-light-secondary dark:bg-dark-secondary',
        borderColor: 'border-light-secondary dark:border-dark-secondary',
        textColor: 'text-black dark:text-white',
        icon: Rocket,
        name: 'Ultra Search',
        description: 'PhD-level comprehensive analysis'
      };
  }
};

export default function SearchStepper({ 
  children, 
  className = "", 
  currentStep = 1,
  mode = 'quick'
}: SearchStepperProps) {
  const [stepHeights, setStepHeights] = useState<number[]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modeConfig = getModeConfig(mode);

  // Measure step heights after render
  useEffect(() => {
    const heights = stepRefs.current.map(ref => ref?.offsetHeight || 0);
    setStepHeights(heights);
  }, [children, currentStep]);

  const totalSteps = React.Children.count(children);

  return (
    <div className={`relative ${className}`}>
      {/* Mode Header */}
      <div className={`mb-6 p-4 rounded-lg ${modeConfig.bgColor} border ${modeConfig.borderColor}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg text-white" style={{ backgroundColor: modeConfig.accentColor }}>
            <modeConfig.icon size={20} />
          </div>
          <div>
            <h3 className={`font-semibold ${modeConfig.textColor}`}>{modeConfig.name}</h3>
            <p className="text-sm text-black/70 dark:text-white/70">{modeConfig.description}</p>
          </div>
        </div>
      </div>

      {/* Steps container */}
      <div className="flex flex-col space-y-4">
        {React.Children.map(children, (child, index) => {
          const stepNumber = index + 1;
          const isVisible = stepNumber <= currentStep;
          const showConnectorLine = stepNumber < currentStep && stepNumber < totalSteps;
          
          if (!isVisible) return null;

          // Calculate line height to next step - ensure minimum height
          const currentStepHeight = stepHeights[index] || 0;
          const lineHeight = Math.max(currentStepHeight + 16, 48); // Add padding and ensure minimum height

          return (
            <div key={index} className="relative">
              {/* Step content */}
              <div className="flex items-start">
                {/* Dot and line container */}
                <div className="flex flex-col items-center mr-4 relative">
                  {/* Step dot */}
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 transition-all duration-500 relative z-10 ${
                    stepNumber < currentStep 
                      ? 'border-[#24A0ED] bg-[#24A0ED]' 
                      : stepNumber === currentStep 
                      ? (stepNumber === totalSteps 
                          ? 'border-[#24A0ED] bg-[#24A0ED]' 
                          : 'border-[#24A0ED] bg-[#24A0ED] animate-pulse')
                      : 'border-light-secondary dark:border-dark-secondary bg-light-secondary dark:bg-dark-secondary'
                  }`} />
                  
                  {/* Connecting line */}
                  {showConnectorLine && (
                    <div 
                      className={`absolute w-0.5 z-0 transition-all duration-500 ${
                        stepNumber < currentStep 
                          ? 'bg-[#24A0ED]' 
                          : 'bg-light-secondary dark:bg-dark-secondary'
                      }`}
                      style={{ 
                        top: '20px', // Position below the current dot with more space
                        left: '50%',
                        transform: 'translateX(-50%)',
                        height: `${lineHeight}px`
                      }} 
                    />
                  )}
                </div>
                
                {/* Step content */}
                <div 
                  className="flex-1 pb-6"
                  ref={el => { stepRefs.current[index] = el; }}
                >
                  {React.isValidElement(child) ? React.cloneElement(child, {
                    stepNumber: stepNumber,
                    currentStep: currentStep,
                    mode: mode,
                  } as any) : child}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SearchStepItem({ children, className = "" }: StepProps) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}

export function SearchProgressStep({ 
  query, 
  onQueryChange, 
  placeholder = "Enter search query...", 
  progress,
  mode = 'quick'
}: SearchStepProps) {
  const modeConfig = getModeConfig(mode);
  
  const getStatusIcon = () => {
    if (!progress) return null;
    
    if (progress.step === 'complete') {
      return (
        <div className="w-5 h-5 text-[#24A0ED]">
          <CheckCircle size={20} />
        </div>
      );
    }
    
    return (
      <div className="w-5 h-5 text-[#24A0ED]">
        <div className="animate-spin">
          <Clock size={20} />
        </div>
      </div>
    );
  };

  const getStepIcon = () => {
    switch (mode) {
      case 'quick':
        return <Search size={16} />;
      case 'pro':
        return <Brain size={16} />;
      case 'ultra':
        return <Rocket size={16} />;
      default:
        return <Search size={16} />;
    }
  };

  return (
    <SearchStepItem>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex items-center gap-2">
              {getStepIcon()}
              <div className="text-sm font-semibold text-black dark:text-white">
                {progress?.message || 'Searching the web'}
              </div>
            </div>
            {progress?.progress && progress.progress > 0 && (
              <div className="text-xs font-medium text-[#24A0ED] bg-light-secondary dark:bg-dark-secondary px-2 py-1 rounded-full">
                {progress.progress}%
              </div>
            )}
          </div>
          <div className="text-xs text-black/70 dark:text-white/70 ml-8">
            {progress?.details || 'Analyzing search requirements and gathering information'}
          </div>
          {progress?.progress && progress.progress > 0 && (
            <div className="ml-8 w-full bg-light-secondary dark:bg-dark-secondary rounded-full h-2 mt-2">
              <div 
                className="bg-[#24A0ED] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <Search className="w-4 h-4 text-black/40 dark:text-white/40" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 bg-light-secondary dark:bg-dark-secondary border border-light-secondary dark:border-dark-secondary rounded-lg text-black dark:text-white text-sm placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#24A0ED]/50 focus:border-[#24A0ED] transition-all duration-200"
            disabled={true}
          />
        </div>
      </div>
    </SearchStepItem>
  );
}

export function SourcesProgressStep({ 
  sources, 
  maxVisible = 8, 
  progress,
  mode = 'quick'
}: SourcesStepProps) {
  const visibleSources = sources.slice(0, maxVisible);
  const hasMore = sources.length > maxVisible;
  const modeConfig = getModeConfig(mode);

  const getStatusIcon = () => {
    if (progress && progress.step === 'complete') {
      return <CheckCircle size={20} className="text-[#24A0ED]" />;
    }
    
    if (progress) {
      return <div className="w-5 h-5 text-[#24A0ED] animate-spin"><Clock size={20} /></div>;
    }
    
    return <Database size={20} className="text-[#24A0ED]" />;
  };

  return (
    <SearchStepItem>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-black dark:text-white">
                {progress?.message || 'Processing sources'}
              </div>
            </div>
            {progress?.progress && progress.progress > 0 && (
              <div className="text-xs font-medium text-[#24A0ED] bg-light-secondary dark:bg-dark-secondary px-2 py-1 rounded-full">
                {progress.progress}%
              </div>
            )}
          </div>
          <div className="text-xs text-black/70 dark:text-white/70 ml-8">
            {progress?.details || `Analyzing ${sources.length} sources for relevance and accuracy`}
          </div>
          {progress?.progress && progress.progress > 0 && (
            <div className="ml-8 w-full bg-light-secondary dark:bg-dark-secondary rounded-full h-2 mt-2">
              <div 
                className="bg-[#24A0ED] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {visibleSources.map((source, index) => (
            <div key={index} className="group flex items-center space-x-3 p-3 bg-light-secondary dark:bg-dark-secondary border border-light-secondary dark:border-dark-secondary rounded-lg hover:bg-light-secondary/80 dark:hover:bg-dark-secondary/80 transition-all duration-150">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-light-secondary dark:border-dark-secondary flex-shrink-0">
                {source.icon ? (
                  <img
                    src={source.icon}
                    alt=""
                    className="w-5 h-5 rounded-sm"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-5 h-5 bg-black/20 dark:bg-white/20 rounded-sm"></div>';
                      }
                    }}
                  />
                ) : (
                  <Globe size={16} className="text-black/40 dark:text-white/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-black dark:text-white truncate group-hover:text-[#24A0ED] transition-colors">
                  {source.title}
                </div>
                <div className="text-xs text-black/60 dark:text-white/60 truncate mt-1">
                  {source.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </div>
              </div>
              <ExternalLink size={14} className="text-black/40 dark:text-white/40 group-hover:text-[#24A0ED] transition-colors" />
            </div>
          ))}
          {hasMore && (
            <div className="text-center py-3">
              <span className="text-xs text-black/60 dark:text-white/60 bg-light-secondary dark:bg-dark-secondary px-3 py-1.5 rounded-full border border-light-secondary dark:border-dark-secondary">
                ... and {sources.length - maxVisible} more sources
              </span>
            </div>
          )}
        </div>
      </div>
    </SearchStepItem>
  );
}

export function AgentProgressStep({ 
  agents = [], 
  progress,
  mode = 'quick'
}: AgentStepProps) {
  const modeConfig = getModeConfig(mode);
  const activeAgents = agents.filter(agent => agent.status === 'running');
  const completedAgents = agents.filter(agent => agent.status === 'completed');
  const failedAgents = agents.filter(agent => agent.status === 'failed');

  const getStatusIcon = () => {
    if (progress && progress.step === 'complete') {
      return <CheckCircle size={20} className="text-[#24A0ED]" />;
    }
    
    if (progress || activeAgents.length > 0) {
      return <div className="w-5 h-5 text-[#24A0ED] animate-spin"><Cpu size={20} /></div>;
    }
    
    return <Cpu size={20} className="text-[#24A0ED]" />;
  };

  return (
    <SearchStepItem>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex items-center gap-2">
              <Cpu size={16} />
              <div className="text-sm font-semibold text-black dark:text-white">
                {progress?.message || 'Executing research agents'}
              </div>
            </div>
            {progress?.progress && progress.progress > 0 && (
              <div className="text-xs font-medium text-[#24A0ED] bg-light-secondary dark:bg-dark-secondary px-2 py-1 rounded-full">
                {progress.progress}%
              </div>
            )}
          </div>
          <div className="text-xs text-black/70 dark:text-white/70 ml-8">
            {progress?.details || `${activeAgents.length} agents running, ${completedAgents.length} completed`}
          </div>
          {progress?.progress && progress.progress > 0 && (
            <div className="ml-8 w-full bg-light-secondary dark:bg-dark-secondary rounded-full h-2 mt-2">
              <div 
                className="bg-[#24A0ED] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          )}
        </div>
        {agents.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {agents.map((agent, index) => (
              <div key={agent.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                agent.status === 'running'
                  ? 'border-[#24A0ED] bg-light-secondary/50 dark:bg-dark-secondary/50'
                  : agent.status === 'completed'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : agent.status === 'failed'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-light-secondary dark:border-dark-secondary bg-light-secondary dark:bg-dark-secondary'
              }`}>
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    agent.status === 'running'
                      ? 'bg-[#24A0ED] text-white'
                      : agent.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : agent.status === 'failed'
                      ? 'bg-red-500 text-white'
                      : 'bg-light-secondary dark:bg-dark-secondary text-black/60 dark:text-white/60'
                  }`}>
                    {agent.status === 'running' ? '🔄' : agent.status === 'completed' ? '✅' : agent.status === 'failed' ? '❌' : '⏳'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-black dark:text-white">
                      Agent {index + 1}
                    </div>
                    <div className="text-xs text-black/60 dark:text-white/60 truncate">
                      {agent.query}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-black/60 dark:text-white/60">
                  {agent.results} results
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SearchStepItem>
  );
}

export function BasicProgressStep({ 
  children, 
  progress,
  isActive = false,
  isComplete = false,
  mode = 'quick'
}: { 
  children: ReactNode;
  progress?: {
    step: string;
    message: string;
    details: string;
    progress: number;
  };
  isActive?: boolean;
  isComplete?: boolean;
  mode?: 'quick' | 'pro' | 'ultra';
}) {
  const modeConfig = getModeConfig(mode);
  
  const getStatusIcon = () => {
    if (isComplete || progress?.step === 'complete') {
      return <CheckCircle size={20} className="text-[#24A0ED]" />;
    }
    
    if (isActive || progress) {
      return <div className="w-5 h-5 text-[#24A0ED] animate-spin"><Clock size={20} /></div>;
    }
    
    return null;
  };

  const getStepIcon = () => {
    if (children?.toString().toLowerCase().includes('generating')) {
      return null; // Remove icon for generating step
    }
    if (children?.toString().toLowerCase().includes('finished')) {
      return null; // Remove icon for finished step
    }
    if (children?.toString().toLowerCase().includes('processing')) {
      return null; // Remove icon for processing step
    }
    if (children?.toString().toLowerCase().includes('validating')) {
      return <Shield size={16} />;
    }
    if (children?.toString().toLowerCase().includes('analyzing')) {
      return <BarChart3 size={16} />;
    }
    return <Lightbulb size={16} />;
  };

  return (
    <SearchStepItem>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex items-center gap-2">
            {getStepIcon()}
            <div className="text-sm font-semibold text-black dark:text-white">
              {progress?.message || children}
            </div>
            {progress?.progress && progress.progress > 0 && (
              <div className="text-xs font-medium text-[#24A0ED] bg-light-secondary dark:bg-dark-secondary px-2 py-1 rounded-full">
                {progress.progress}%
              </div>
            )}
          </div>
        </div>
        {progress?.details && (
          <div className="text-xs text-black/70 dark:text-white/70 ml-8">
            {progress.details}
          </div>
        )}
        {progress?.progress && progress.progress > 0 && (
          <div className="ml-8 w-full bg-light-secondary dark:bg-dark-secondary rounded-full h-2 mt-2">
            <div 
              className="bg-[#24A0ED] h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        )}
      </div>
    </SearchStepItem>
  );
}
