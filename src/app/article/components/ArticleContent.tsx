'use client';

import React, { useState } from 'react';
import { ExternalLink, Sparkles, Eye, BarChart3 } from 'lucide-react';
import { NewsArticle } from '@/lib/news/types';

interface ArticleContentProps {
  article: NewsArticle;
}

const ArticleContent: React.FC<ArticleContentProps> = ({ article }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const generateAISummary = async () => {
    if (aiSummary) {
      setAiSummary(null);
      return;
    }

    setLoadingSummary(true);
    try {
      // In production, this would call your AI summarization API
      setTimeout(() => {
        setAiSummary(article.summary || `AI Summary: This article discusses ${article.title.toLowerCase()}. The content covers key developments and implications in ${article.topics.join(', ').toLowerCase()}. Key stakeholders and expert opinions are presented with supporting evidence and analysis.`);
        setLoadingSummary(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      setLoadingSummary(false);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'negative': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'neutral': return 'text-gray-600 bg-gray-100 dark:bg-gray-800/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800/20';
    }
  };

  const getBiasColor = (bias?: string) => {
    switch (bias) {
      case 'left': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'right': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'center': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800/20';
    }
  };

  return (
    <div className="p-6">
      {/* Article Image */}
      {article.thumbnail && (
        <div className="mb-6">
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-64 sm:h-80 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* AI Analysis Panel */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#24A0ED]" />
            <h3 className="font-semibold text-black dark:text-white">AI Analysis</h3>
          </div>
          <button
            onClick={generateAISummary}
            disabled={loadingSummary}
            className="flex items-center space-x-1 px-3 py-1 bg-[#24A0ED] text-white rounded-lg hover:bg-[#1d8bd1] transition-colors disabled:opacity-50 text-sm"
          >
            {loadingSummary ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{aiSummary ? 'Hide Summary' : 'Generate Summary'}</span>
          </button>
        </div>

        {/* Analysis Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-[#24A0ED]">
              {article.qualityScore}/100
            </div>
            <div className="text-xs text-black/60 dark:text-white/60">Quality Score</div>
          </div>
          
          {article.sentiment && (
            <div className="text-center">
              <div className={`text-sm font-medium px-2 py-1 rounded-full ${getSentimentColor(article.sentiment)}`}>
                {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
              </div>
              <div className="text-xs text-black/60 dark:text-white/60 mt-1">Sentiment</div>
            </div>
          )}
          
          {article.bias && (
            <div className="text-center">
              <div className={`text-sm font-medium px-2 py-1 rounded-full ${getBiasColor(article.bias)}`}>
                {article.bias.charAt(0).toUpperCase() + article.bias.slice(1)}
              </div>
              <div className="text-xs text-black/60 dark:text-white/60 mt-1">Bias</div>
            </div>
          )}
          
          {article.relevanceScore && (
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {Math.round(article.relevanceScore)}%
              </div>
              <div className="text-xs text-black/60 dark:text-white/60">Relevance</div>
            </div>
          )}
        </div>

        {/* AI Summary */}
        {aiSummary && (
          <div className="bg-white dark:bg-dark-200 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[#24A0ED]" />
              <span className="font-medium text-black dark:text-white">AI Summary</span>
            </div>
            <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed">
              {aiSummary}
            </p>
          </div>
        )}
      </div>

      {/* Article Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {article.summary && (
          <div className="bg-light-100 dark:bg-dark-100 rounded-lg p-4 mb-6 border-l-4 border-[#24A0ED]">
            <h4 className="flex items-center space-x-2 font-semibold text-black dark:text-white mb-2">
              <Eye className="w-4 h-4" />
              <span>Quick Summary</span>
            </h4>
            <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed">
              {article.summary}
            </p>
          </div>
        )}

        <div className="text-black dark:text-white leading-relaxed">
          {showFullContent ? (
            <div>
              <p className="whitespace-pre-wrap">{article.content}</p>
              {article.content.length > 500 && (
                <button
                  onClick={() => setShowFullContent(false)}
                  className="mt-4 text-[#24A0ED] hover:text-[#1d8bd1] font-medium"
                >
                  Show Less
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="whitespace-pre-wrap">
                {article.content.length > 500 
                  ? article.content.substring(0, 500) + '...'
                  : article.content
                }
              </p>
              {article.content.length > 500 && (
                <button
                  onClick={() => setShowFullContent(true)}
                  className="mt-4 text-[#24A0ED] hover:text-[#1d8bd1] font-medium"
                >
                  Read Full Article
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* External Link */}
      <div className="mt-6 pt-6 border-t border-light-200 dark:border-dark-200">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-light-100 dark:bg-dark-100 border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors text-black dark:text-white"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Read Original Article</span>
        </a>
      </div>
    </div>
  );
};

export default ArticleContent;
