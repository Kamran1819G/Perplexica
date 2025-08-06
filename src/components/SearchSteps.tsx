'use client';

import React from 'react';
import { SearchStep } from '@/lib/search/orchestrator';

interface SearchStepsProps {
  steps: SearchStep[];
  isVisible: boolean;
}

const SearchSteps: React.FC<SearchStepsProps> = ({ steps, isVisible }) => {
  if (!isVisible || !steps || steps.length === 0) {
    return null;
  }

  const getStatusColor = (status: SearchStep['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200 text-gray-600';
      case 'running':
        return 'bg-blue-200 text-blue-700';
      case 'completed':
        return 'bg-green-200 text-green-700';
      case 'failed':
        return 'bg-red-200 text-red-700';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  const getStatusIcon = (status: SearchStep['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getDuration = (step: SearchStep) => {
    if (step.startTime && step.endTime) {
      const duration = new Date(step.endTime).getTime() - new Date(step.startTime).getTime();
      return `${Math.round(duration / 1000)}s`;
    }
    if (step.startTime) {
      const duration = Date.now() - new Date(step.startTime).getTime();
      return `${Math.round(duration / 1000)}s`;
    }
    return '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Search Orchestrator
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {steps.filter(s => s.status === 'completed').length} / {steps.length} completed
        </div>
      </div>
      
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              step.status === 'running'
                ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                : step.status === 'completed'
                ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                : step.status === 'failed'
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
            }`}
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor(step.status)}`}>
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {step.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {step.description}
                </div>
                {step.error && (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Error: {step.error}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {getDuration(step)}
            </div>
          </div>
        ))}
      </div>
      
      {steps.some(s => s.status === 'running') && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Executing search steps...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSteps; 