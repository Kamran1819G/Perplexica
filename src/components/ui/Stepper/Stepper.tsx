import React, { ReactNode } from "react";

interface CustomStepperProps {
  children: ReactNode;
  className?: string;
  currentStep?: number;
}

interface CustomStepProps {
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

export default function CustomStepper({ children, className = "", currentStep = 1 }: CustomStepperProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Steps container */}
      <div className="relative space-y-6">
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

export function CustomStep({ children, isActive = false, isCompleted = false, className = "", stepNumber, currentStep }: CustomStepProps) {
  const isVisible = stepNumber ? stepNumber <= (currentStep || 1) : true;
  
  if (!isVisible) return null;

  return (
    <div className={`relative flex items-start space-x-6 ${className} animate-in fade-in-0 slide-in-from-left-2 duration-500`}>
      {/* Step indicator circle */}
      <div className={`flex-shrink-0 w-4 h-4 rounded-full mt-1.5 transition-all duration-500 ease-out ${
        isCompleted ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 
        isActive ? 'bg-blue-500 shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20' : 
        'bg-gray-400/60 border border-gray-500/30'
      }`}></div>
      
      {/* Step content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

export function SearchStep({ query, onQueryChange, placeholder = "Enter search query...", stepNumber, currentStep }: SearchStepProps) {
  const isVisible = stepNumber ? stepNumber <= (currentStep || 1) : true;
  
  if (!isVisible) return null;

  return (
    <CustomStep stepNumber={stepNumber} currentStep={currentStep || 1}>
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-200">Searching the web</div>
          <div className="text-xs text-gray-500 font-mono">Searching</div>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
          />
        </div>
      </div>
    </CustomStep>
  );
}

export function SourcesStep({ sources, maxVisible = 8, stepNumber, currentStep }: SourcesStepProps) {
  const isVisible = stepNumber ? stepNumber <= (currentStep || 1) : true;
  
  if (!isVisible) return null;

  const visibleSources = sources.slice(0, maxVisible);
  const hasMore = sources.length > maxVisible;

  return (
    <CustomStep stepNumber={stepNumber} currentStep={currentStep || 1}>
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-200">
            Reading sources - {sources.length}
          </div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {visibleSources.map((source, index) => (
            <div key={index} className="group flex items-center space-x-3 p-3 bg-gray-900/30 border border-gray-700/50 rounded-xl hover:bg-gray-800/50 hover:border-gray-600/50 transition-all duration-200 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center border border-gray-700/30">
                {source.icon ? (
                  <img
                    src={source.icon}
                    alt=""
                    className="w-5 h-5 rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-5 h-5 bg-gray-600 rounded"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate group-hover:text-gray-100 transition-colors">
                  {source.title}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {source.url.replace(/.+\/\/|www.|\..+/g, '')}
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-500 flex-shrink-0 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          ))}
          {hasMore && (
            <div className="text-center py-2">
              <span className="text-xs text-gray-500 bg-gray-900/30 px-3 py-1 rounded-full border border-gray-700/30">
                ... and {sources.length - maxVisible} more sources
              </span>
            </div>
          )}
        </div>
      </div>
    </CustomStep>
  );
}

export function SimpleStep({ children, stepNumber, currentStep }: { children: ReactNode; stepNumber?: number; currentStep?: number }) {
  const isVisible = stepNumber ? stepNumber <= (currentStep || 1) : true;
  
  if (!isVisible) return null;

  return (
    <CustomStep stepNumber={stepNumber} currentStep={currentStep || 1}>
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-200">
          {children}
        </div>
      </div>
    </CustomStep>
  );
}

// Legacy exports for backward compatibility
export function Step({ children }: { children: ReactNode }) {
  return <CustomStep>{children}</CustomStep>;
}
