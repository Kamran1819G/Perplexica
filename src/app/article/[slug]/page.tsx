'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  ThumbsUp, 
  ThumbsDown,
  ExternalLink,
  Clock,
  Sparkles,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { NewsArticle } from '@/lib/news/types';
import ArticleContent from '../components/ArticleContent';
import ArticleSidebar from '../components/ArticleSidebar';
import ArticleActions from '../components/ArticleActions';
import ArticleAgent from '../components/ArticleAgent';

const ArticlePage = () => {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [showAgent, setShowAgent] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const slug = params.slug as string;
        
        // Decode the slug which should be a URL or article ID
        const articleUrl = decodeURIComponent(slug);
        
        // First try to fetch article summary from our API
        const response = await fetch(`/api/article/${encodeURIComponent(articleUrl)}`);
        
        if (response.ok) {
          const data = await response.json();
          setArticle(data.article);
          setRelatedArticles(data.related || []);
        } else {
          // Fallback: Create article from URL for analysis
          await analyzeArticleFromUrl(articleUrl);
        }
      } catch (error) {
        console.error('Failed to fetch article:', error);
        toast.error('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [params.slug]);

  const analyzeArticleFromUrl = async (url: string) => {
    try {
      // Use our existing search functionality to get article info
      const searchResponse = await fetch(`/?q=Summary: ${url}`);
      
      // Create a basic article object for analysis
      const basicArticle: NewsArticle = {
        id: `url_${Date.now()}`,
        title: 'Article Analysis',
        content: `Analyzing article from: ${url}`,
        url: url,
        publishedAt: new Date().toISOString(),
        source: {
          name: new URL(url).hostname.replace('www.', ''),
          domain: new URL(url).hostname.replace('www.', ''),
          credibility: 'medium'
        },
        qualityScore: 50,
        topics: ['General']
      };
      
      setArticle(basicArticle);
      
    } catch (error) {
      console.error('Failed to analyze URL:', error);
      toast.error('Failed to analyze article');
    }
  };

  const handleInteraction = async (action: 'like' | 'dislike' | 'save' | 'share') => {
    if (!article) return;

    try {
      // Record user interaction
      await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recordInteraction',
          userId: 'user123', // In production, get from auth
          articleId: article.id,
          topics: article.topics,
          source: article.source.domain,
          interactionType: action
        })
      });

      // Show feedback
      const messages = {
        like: 'Article liked! This helps us show you more relevant content.',
        dislike: 'Feedback recorded. We\'ll show you less content like this.',
        save: 'Article saved for later reading.',
        share: 'Article link copied to clipboard!'
      };

      toast.success(messages[action]);

      // Handle share action
      if (action === 'share') {
        await navigator.clipboard.writeText(window.location.href);
      }

    } catch (error) {
      console.error('Failed to record interaction:', error);
      toast.error('Failed to record interaction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-10 bg-light-secondary dark:bg-dark-secondary rounded animate-pulse w-32"></div>
            <div className="h-10 bg-light-secondary dark:bg-dark-secondary rounded animate-pulse w-24"></div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-6 space-y-4">
                <div className="h-8 bg-light-200 dark:bg-dark-200 rounded animate-pulse"></div>
                <div className="h-4 bg-light-200 dark:bg-dark-200 rounded animate-pulse w-3/4"></div>
                <div className="h-64 bg-light-200 dark:bg-dark-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 bg-light-200 dark:bg-dark-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 space-y-4">
                <div className="h-6 bg-light-200 dark:bg-dark-200 rounded animate-pulse"></div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-light-200 dark:bg-dark-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-black dark:text-white mb-4">Article Not Found</h1>
            <p className="text-black/70 dark:text-white/70 mb-6">
              The article you're looking for could not be loaded.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center px-4 py-2 bg-[#24A0ED] text-white rounded-lg hover:bg-[#1d8bd1] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/discover"
            className="inline-flex items-center px-4 py-2 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors text-black dark:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAgent(!showAgent)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                showAgent 
                  ? 'bg-[#24A0ED] text-white' 
                  : 'bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 text-black dark:text-white hover:bg-light-200 dark:hover:bg-dark-200'
              }`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assistant
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-3">
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-200 dark:border-dark-200 overflow-hidden">
              {/* Article Header */}
              <div className="p-6 border-b border-light-200 dark:border-dark-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-black/70 dark:text-white/70">
                      {article.source.name}
                    </span>
                  </div>
                  
                  {article.source.credibility === 'high' && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700 dark:text-green-400">Trusted Source</span>
                    </div>
                  )}
                  
                  {article.qualityScore >= 70 && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-700 dark:text-blue-400">High Quality</span>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-4">
                  {article.title}
                </h1>

                <div className="flex items-center space-x-4 text-sm text-black/60 dark:text-white/60">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {article.topics.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {article.topics.slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-light-200 dark:bg-dark-200 rounded-full text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Article Body */}
              <ArticleContent article={article} />

              {/* Article Actions */}
              <div className="p-6 border-t border-light-200 dark:border-dark-200">
                <ArticleActions 
                  article={article} 
                  onInteraction={handleInteraction}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ArticleSidebar 
              article={article}
              relatedArticles={relatedArticles}
            />
          </div>
        </div>

        {/* AI Assistant Panel */}
        {showAgent && (
          <div className="fixed bottom-6 right-6 w-96 h-96 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg shadow-2xl z-50">
            <ArticleAgent 
              article={article}
              onClose={() => setShowAgent(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlePage;
