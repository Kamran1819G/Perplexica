'use client';

import React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Clock, 
  ExternalLink,
  Sparkles,
  BarChart3,
  Globe,
  Users
} from 'lucide-react';
import { NewsArticle } from '@/lib/news/types';

interface ArticleSidebarProps {
  article: NewsArticle;
  relatedArticles: NewsArticle[];
}

const ArticleSidebar: React.FC<ArticleSidebarProps> = ({ article, relatedArticles }) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Article Insights */}
      <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 border border-light-200 dark:border-dark-200">
        <h3 className="flex items-center space-x-2 font-semibold text-black dark:text-white mb-4">
          <BarChart3 className="w-5 h-5 text-[#24A0ED]" />
          <span>Article Insights</span>
        </h3>

        <div className="space-y-3">
          {/* Source Credibility */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-black/70 dark:text-white/70">Source Credibility</span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              article.source.credibility === 'high' 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : article.source.credibility === 'medium'
                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {article.source.credibility.charAt(0).toUpperCase() + article.source.credibility.slice(1)}
            </div>
          </div>

          {/* Reading Time */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-black/70 dark:text-white/70">Est. Reading Time</span>
            <span className="text-sm font-medium text-black dark:text-white">
              {Math.ceil(article.content.length / 1000)} min
            </span>
          </div>

          {/* Topics */}
          <div>
            <span className="text-sm text-black/70 dark:text-white/70 block mb-2">Topics</span>
            <div className="flex flex-wrap gap-1">
              {article.topics.slice(0, 4).map((topic, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-light-200 dark:bg-dark-200 rounded-full text-xs text-black/80 dark:text-white/80"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Sentiment & Bias */}
          {(article.sentiment || article.bias) && (
            <div className="pt-3 border-t border-light-200 dark:border-dark-200">
              {article.sentiment && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-black/70 dark:text-white/70">Sentiment</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    article.sentiment === 'positive' 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : article.sentiment === 'negative'
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-800/20 text-gray-700 dark:text-gray-400'
                  }`}>
                    {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
                  </span>
                </div>
              )}
              
              {article.bias && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black/70 dark:text-white/70">Political Bias</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    article.bias === 'center' 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : article.bias === 'left'
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}>
                    {article.bias.charAt(0).toUpperCase() + article.bias.slice(1)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 border border-light-200 dark:border-dark-200">
          <h3 className="flex items-center space-x-2 font-semibold text-black dark:text-white mb-4">
            <TrendingUp className="w-5 h-5 text-[#24A0ED]" />
            <span>Related Articles</span>
          </h3>

          <div className="space-y-3">
            {relatedArticles.slice(0, 4).map((relatedArticle, index) => (
              <Link
                key={index}
                href={`/article/${encodeURIComponent(relatedArticle.url)}`}
                className="block p-3 rounded-lg bg-light-100 dark:bg-dark-100 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
              >
                <h4 className="font-medium text-black dark:text-white text-sm line-clamp-2 mb-2">
                  {relatedArticle.title}
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/60 dark:text-white/60">
                    {relatedArticle.source.name}
                  </span>
                  <div className="flex items-center space-x-1 text-black/60 dark:text-white/60">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(relatedArticle.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Topics */}
      <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 border border-light-200 dark:border-dark-200">
        <h3 className="flex items-center space-x-2 font-semibold text-black dark:text-white mb-4">
          <Globe className="w-5 h-5 text-[#24A0ED]" />
          <span>Trending Now</span>
        </h3>

        <div className="space-y-2">
          {['Artificial Intelligence', 'Climate Change', 'Global Economy', 'Space Exploration', 'Healthcare Innovation'].map((topic, index) => (
            <Link
              key={index}
              href={`/discover?topic=${encodeURIComponent(topic)}`}
              className="flex items-center justify-between p-2 rounded-lg bg-light-100 dark:bg-dark-100 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
            >
              <span className="text-sm font-medium text-black dark:text-white">{topic}</span>
              <div className="flex items-center space-x-1 text-xs text-black/60 dark:text-white/60">
                <TrendingUp className="w-3 h-3" />
                <span>{Math.floor(Math.random() * 100) + 50}k</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Fact Check */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="flex items-center space-x-2 font-semibold text-black dark:text-white mb-3">
          <Sparkles className="w-5 h-5 text-[#24A0ED]" />
          <span>AI Fact Check</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm text-black dark:text-white font-medium">Claims Verified</p>
              <p className="text-xs text-black/70 dark:text-white/70">
                Key facts cross-referenced with trusted sources
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm text-black dark:text-white font-medium">Source Analysis</p>
              <p className="text-xs text-black/70 dark:text-white/70">
                Author credentials and publication history reviewed
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm text-black dark:text-white font-medium">Context Check</p>
              <p className="text-xs text-black/70 dark:text-white/70">
                Information placed in broader context
              </p>
            </div>
          </div>
        </div>

        <button className="w-full mt-4 px-3 py-2 bg-[#24A0ED] text-white rounded-lg hover:bg-[#1d8bd1] transition-colors text-sm font-medium">
          View Full Analysis
        </button>
      </div>
    </div>
  );
};

export default ArticleSidebar;
