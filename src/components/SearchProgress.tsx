'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Brain, 
  Rocket, 
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
  Zap,
  ExternalLink,
} from 'lucide-react';

interface SearchProgressProps {
  mode?: 'quick' | 'pro' | 'ultra';
  progress?: {
    step: string;
    message: string;
    details: string;
    progress: number;
  };
  agents?: Array<{
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    query: string;
    results: number;
  }>;
  sources?: Array<{
    title: string;
    url: string;
    icon?: string;
  }>;
  isVisible?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
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
        description: 'Fast and efficient search',
        accent: 'bg-[#24A0ED]'
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
        description: 'Comprehensive research analysis',
        accent: 'bg-[#8B5CF6]'
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
        description: 'PhD-level comprehensive analysis',
        accent: 'bg-[#10B981]'
      };
  }
};

const getStepIcon = (stepName: string, mode: 'quick' | 'pro' | 'ultra' = 'quick') => {
  const name = stepName.toLowerCase();
  
  if (name.includes('planning') || name.includes('analysis')) {
    return <Brain size={16} />;
  }
  if (name.includes('search') || name.includes('query')) {
    return <Search size={16} />;
  }
  if (name.includes('agent') || name.includes('parallel')) {
    return <Cpu size={16} />;
  }
  if (name.includes('validation') || name.includes('cross')) {
    return <Shield size={16} />;
  }
  if (name.includes('processing') || name.includes('ranking')) {
    return <BarChart3 size={16} />;
  }
  if (name.includes('generation') || name.includes('response')) {
    return <Sparkles size={16} />;
  }
  if (name.includes('source') || name.includes('document')) {
    return <Globe size={16} />;
  }
  if (name.includes('rerank') || name.includes('sort')) {
    return <TrendingUp size={16} />;
  }
  if (name.includes('ultra') || name.includes('comprehensive')) {
    return <Rocket size={16} />;
  }
  if (name.includes('pro') || name.includes('advanced')) {
    return <Brain size={16} />;
  }
  
  return <Lightbulb size={16} />;
};

const SearchProgress: React.FC<SearchProgressProps> = ({ 
  mode = 'quick',
  progress,
  agents = [],
  sources = [],
  isVisible = true,
  onPause,
  onResume,
  onCancel
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const modeConfig = getModeConfig(mode);
  
  if (!isVisible) {
    return null;
  }

  const activeAgents = agents.filter(agent => agent.status === 'running');
  const completedAgents = agents.filter(agent => agent.status === 'completed');
  const failedAgents = agents.filter(agent => agent.status === 'failed');

  const handlePauseResume = () => {
    if (isPaused) {
      onResume?.();
      setIsPaused(false);
    } else {
      onPause?.();
      setIsPaused(true);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-light-secondary dark:border-dark-secondary overflow-hidden">
      {/* Progress Bar */}
      <div className={`p-4 ${modeConfig.bgColor} border-b ${modeConfig.borderColor}`}>
        {progress?.progress && progress.progress > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${modeConfig.textColor}`}>
                {progress.message}
              </span>
              <span className="text-xs font-medium text-[#24A0ED] bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                {progress.progress}%
              </span>
            </div>
            <div className="w-full bg-light-secondary dark:bg-dark-secondary rounded-full h-2">
              <div 
                className="bg-[#24A0ED] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            {progress.details && (
              <p className="text-xs text-black/70 dark:text-white/70">
                {progress.details}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Agents Status */}
        {agents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu size={16} className="text-[#24A0ED]" />
                <span className="text-sm font-medium text-black dark:text-white">
                  Research Agents
                </span>
              </div>
              <div className="text-xs text-black/60 dark:text-white/60">
                {completedAgents.length}/{agents.length} completed
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agents.map((agent, index) => (
                <div key={agent.id} className={`p-3 rounded-lg border transition-all duration-200 ${
                  agent.status === 'running'
                    ? 'border-[#24A0ED] bg-light-secondary/50 dark:bg-dark-secondary/50'
                    : agent.status === 'completed'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : agent.status === 'failed'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-light-secondary dark:border-dark-secondary bg-light-secondary dark:bg-dark-secondary'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-black dark:text-white">
                          Agent {index + 1}
                        </div>
                        <div className="text-xs text-black/60 dark:text-white/60 flex-shrink-0 ml-2">
                          {agent.results} results
                        </div>
                      </div>
                      <div className="text-xs text-black/60 dark:text-white/60 leading-relaxed break-words">
                        {agent.query}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Sources Status */}
        {sources.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe size={16} className="text-[#24A0ED]" />
                <span className="text-sm font-medium text-black dark:text-white">
                  Sources Found
                </span>
              </div>
              <div className="text-xs text-black/60 dark:text-white/60">
                {sources.length} sources
              </div>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sources.slice(0, 6).map((source, index) => (
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
              {sources.length > 6 && (
                <div className="text-center py-2">
                  <span className="text-xs text-black/60 dark:text-white/60 bg-light-secondary dark:bg-dark-secondary px-3 py-1.5 rounded-full border border-light-secondary dark:border-dark-secondary">
                    ... and {sources.length - 6} more sources
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Status Summary */}
        <div className={`p-3 rounded-lg ${modeConfig.bgColor} border ${modeConfig.borderColor}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-5 h-5 text-[#24A0ED] ${isPaused ? '' : 'animate-spin'}`}>
              <Clock size={20} />
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${modeConfig.textColor}`}>
                {isPaused ? 'Search paused' : progress?.message || 'Processing search operations...'}
              </div>
              <div className="text-xs text-black/70 dark:text-white/70">
                {activeAgents.length > 0 ? `${activeAgents.length} agents running` : 'All operations completed'}
              </div>
            </div>
            {failedAgents.length > 0 && (
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                <AlertCircle size={16} />
                <span className="text-xs font-medium">{failedAgents.length} failed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchProgress;
