'use client';

import { cn } from '@/lib/utils';
import { ArrowRight, HelpCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface FollowUpQuestionsProps {
  followUpQuestions?: string[];
  relatedQueries?: string[];
  onQuestionSelect: (question: string) => void;
  className?: string;
}

const FollowUpQuestions = ({
  followUpQuestions = [],
  relatedQueries = [],
  onQuestionSelect,
  className,
}: FollowUpQuestionsProps) => {
  const { t } = useTranslation();

  if (followUpQuestions.length === 0 && relatedQueries.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-6 space-y-4', className)}>
      {/* Follow-up Questions */}
      {followUpQuestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('followUp.title') || 'Follow-up questions'}
          </h3>
          </div>
          <div className="grid gap-2">
            {followUpQuestions.map((question, index) => (
              <button
                key={`followup-${index}`}
                onClick={() => onQuestionSelect(question)}
                className={cn(
                  'group flex items-center justify-between p-3 text-left',
                  'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800',
                  'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                  'rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                )}
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 pr-2">
                  {question}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related Queries */}
      {relatedQueries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('related.title') || 'Related searches'}
          </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedQueries.map((query, index) => (
              <button
                key={`related-${index}`}
                onClick={() => onQuestionSelect(query)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 text-xs',
                  'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800',
                  'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                  'rounded-full transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                  'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <span>{query}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpQuestions;