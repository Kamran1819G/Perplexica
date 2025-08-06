import React, { ReactNode, useRef, useEffect, useState } from "react";

interface StepperProps {
  children: ReactNode;
  className?: string;
  currentStep?: number;
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
}

export default function ProgressStepper({ children, className = "", currentStep = 1 }: StepperProps) {
  const [stepHeights, setStepHeights] = useState<number[]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Measure step heights after render
  useEffect(() => {
    const heights = stepRefs.current.map(ref => ref?.offsetHeight || 0);
    setStepHeights(heights);
  }, [children, currentStep]);

  const totalSteps = React.Children.count(children);

  return (
    <div className={`relative ${className}`}>
      {/* Steps container */}
      <div className="flex flex-col">
        {React.Children.map(children, (child, index) => {
          const stepNumber = index + 1;
          const isVisible = stepNumber <= currentStep;
          const showConnectorLine = stepNumber < currentStep && stepNumber < totalSteps;
          
          if (!isVisible) return null;

          // Calculate line height to next step
          const currentStepHeight = stepHeights[index] || 0;
          const lineHeight = Math.max(currentStepHeight - 4, 32); // Subtract dot height with 8px extra, minimum 32px

          return (
            <div key={index} className="relative">
              {/* Step content */}
              <div className="flex items-start">
                {/* Dot and line container */}
                <div className="flex flex-col items-center mr-3 relative">
                  {/* Step dot */}
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 border-2 transition-all duration-300 relative z-10 ${
                    stepNumber < currentStep 
                      ? 'bg-green-500 border-green-500' 
                      : stepNumber === currentStep 
                      ? (stepNumber === totalSteps 
                          ? 'bg-green-500 border-green-500' 
                          : stepNumber === totalSteps - 1 
                          ? 'bg-orange-500 border-orange-500 animate-pulse' 
                          : 'bg-blue-500 border-blue-500')
                      : 'bg-gray-600 border-gray-600'
                  }`} />
                  
                  {/* Connecting line from center of this dot to center of next dot */}
                  {showConnectorLine && (
                    <div 
                      className={`absolute w-0.5 z-0 transition-all duration-300 ${
                        stepNumber < currentStep 
                          ? 'bg-green-500' 
                          : 'bg-gray-600'
                      }`}
                      style={{ 
                        top: '6px', // Center of current dot (half of 12px dot height)
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

export function StepItem({ children, className = "" }: StepProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function SearchProgressStep({ query, onQueryChange, placeholder = "Enter search query...", progress }: SearchStepProps) {
  const getStatusIcon = () => {
    if (!progress) return null;
    
    if (progress.step === 'complete') {
      return (
        <div className="w-4 h-4 text-green-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-4 h-4">
        <svg className="animate-spin text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416" className="animate-spin-reverse" />
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  };

  return (
    <StepItem>
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <div className="text-sm font-medium text-gray-100">
              {progress?.message || 'Searching the web'}
            </div>
            {progress?.progress && progress.progress > 0 && (
              <div className="text-xs text-blue-400 font-medium">
                {progress.progress}%
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {progress?.details || 'Searching'}
          </div>
          {progress?.progress && progress.progress > 0 && (
            <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-gray-700/50 rounded-lg text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all duration-200"
            disabled={true}
          />
        </div>
      </div>
    </StepItem>
  );
}

export function SourcesProgressStep({ sources, maxVisible = 8, progress }: SourcesStepProps) {
  const visibleSources = sources.slice(0, maxVisible);
  const hasMore = sources.length > maxVisible;

  return (
    <StepItem>
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {progress && (
              <div className="w-4 h-4">
                {progress.step === 'complete' ? (
                  <svg className="text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="15.708" />
                  </svg>
                )}
              </div>
            )}
            <div className="text-sm font-medium text-gray-100">
              {progress?.message || 'Reading sources'}
            </div>
            {progress?.progress && progress.progress > 0 && (
              <div className="text-xs text-blue-400 font-medium">
                {progress.progress}%
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {progress?.details || `Analyzing ${sources.length} sources`}
          </div>
          {progress?.progress && progress.progress > 0 && (
            <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {visibleSources.map((source, index) => (
            <div key={index} className="group flex items-center space-x-3 p-2.5 bg-gray-800/50 border border-gray-700/30 rounded-lg hover:bg-gray-750/60 hover:border-gray-600/40 transition-all duration-150">
              <div className="w-6 h-6 rounded-md bg-gray-700/50 flex items-center justify-center border border-gray-600/30 flex-shrink-0">
                {source.icon ? (
                  <img
                    src={source.icon}
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
                ) : (
                  <div className="w-4 h-4 bg-gray-600/50 rounded-sm"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-100 truncate group-hover:text-white transition-colors">
                  {source.title}
                </div>
                <div className="text-xs text-gray-400 truncate mt-0.5">
                  {source.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </div>
              </div>
              <div className="flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="text-center py-2">
              <span className="text-xs text-gray-500 bg-gray-800/30 px-3 py-1.5 rounded-full border border-gray-700/30">
                ... and {sources.length - maxVisible} more sources
              </span>
            </div>
          )}
        </div>
      </div>
    </StepItem>
  );
}

export function BasicProgressStep({ 
  children, 
  progress,
  isActive = false,
  isComplete = false 
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
}) {
  const getStatusIcon = () => {
    if (isComplete || progress?.step === 'complete') {
      return (
        <div className="w-4 h-4 text-green-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    if (isActive || progress) {
      return (
        <div className="w-4 h-4">
          <svg className="animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="15.708" />
          </svg>
        </div>
      );
    }
    
    return null;
  };

  return (
    <StepItem>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div className="text-sm font-medium text-gray-100">
            {progress?.message || children}
          </div>
          {progress?.progress && progress.progress > 0 && (
            <div className="text-xs text-blue-400 font-medium">
              {progress.progress}%
            </div>
          )}
        </div>
        {progress?.details && (
          <div className="text-xs text-gray-400 ml-6">
            {progress.details}
          </div>
        )}
        {progress?.progress && progress.progress > 0 && (
          <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2 ml-6">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        )}
      </div>
    </StepItem>
  );
}