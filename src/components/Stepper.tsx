import React, { ReactNode } from "react";

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
}

export default function ProgressStepper({ children, className = "", currentStep = 1 }: StepperProps) {
  const totalSteps = React.Children.count(children);
  const lineHeight = currentStep === totalSteps ? 'calc(100% - 1.5rem)' : '100%';
  
  return (
    <div className={`relative ${className}`}>
      {/* Vertical line background - positioned to go through center of 8px dots */}
      <div 
        className="absolute w-0.5 bg-gray-600 top-3 z-0" 
        style={{ 
          left: '3px',
          height: lineHeight
        }}
      ></div>
      
      {/* Steps container */}
      <div className="relative space-y-6 z-10">
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              stepNumber: index + 1,
              currentStep: currentStep,
            } as any);
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function StepItem({ children, isActive = false, isCompleted = false, className = "", stepNumber, currentStep }: StepProps) {
  const isVisible = stepNumber ? stepNumber <= (currentStep || 1) : true;
  
  if (!isVisible) return null;

  const stepState = isCompleted ? 'completed' : (isActive || stepNumber === currentStep) ? 'active' : 'inactive';

  return (
    <div className={`relative flex items-start space-x-3 ${className} animate-in fade-in-0 slide-in-from-left-2 duration-300`}>
      {/* Step indicator circle - positioned to align with line */}
      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 transition-all duration-300 relative z-20 ${
        stepState === 'completed' ? 'bg-green-500' : 
        stepState === 'active' ? 'bg-blue-500' : 
        'bg-gray-600'
      }`} style={{ marginLeft: '0px' }}></div>
      
      {/* Step content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

export function SearchProgressStep({ query, onQueryChange, placeholder = "Enter search query...", stepNumber, currentStep }: SearchStepProps) {
  const isVisible = stepNumber ? stepNumber <= (currentStep || 1) : true;
  
  if (!isVisible) return null;

  return (
    <StepItem stepNumber={stepNumber} currentStep={currentStep || 1}>
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-100">Searching the web</div>
          <div className="text-xs text-gray-400">Searching</div>
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
          />
        </div>
      </div>
    </StepItem>
  );
}

export function SourcesProgressStep({ sources, maxVisible = 8, stepNumber, currentStep }: SourcesStepProps) {
  const isVisible = stepNumber ? stepNumber <= (currentStep || 1) : true;
  
  if (!isVisible) return null;

  const visibleSources = sources.slice(0, maxVisible);
  const hasMore = sources.length > maxVisible;

  return (
    <StepItem stepNumber={stepNumber} currentStep={currentStep || 1}>
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-100">
            Reading sources
          </div>
          <div className="text-xs text-gray-400">
            Analyzing {sources.length} sources
          </div>
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

export function BasicProgressStep({ children, stepNumber, currentStep }: { children: ReactNode; stepNumber?: number; currentStep?: number }) {
  const isVisible = stepNumber ? stepNumber <= (currentStep || 1) : true;
  
  if (!isVisible) return null;

  return (
    <StepItem stepNumber={stepNumber} currentStep={currentStep || 1}>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-100">
          {children}
        </div>
      </div>
    </StepItem>
  );
}

// Legacy exports for backward compatibility
export function CustomStepper(props: StepperProps) {
  return <ProgressStepper {...props} />;
}

export function CustomStep(props: StepProps) {
  return <StepItem {...props} />;
}

export function SearchStep(props: SearchStepProps) {
  return <SearchProgressStep {...props} />;
}

export function SourcesStep(props: SourcesStepProps) {
  return <SourcesProgressStep {...props} />;
}

export function SimpleStep(props: { children: ReactNode; stepNumber?: number; currentStep?: number }) {
  return <BasicProgressStep {...props} />;
}

export function Step({ children }: { children: ReactNode }) {
  return <StepItem>{children}</StepItem>;
}
