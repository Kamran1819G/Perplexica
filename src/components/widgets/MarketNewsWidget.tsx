'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, TrendingUp } from 'lucide-react';

interface MarketNews {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

const MarketNewsWidget: React.FC = () => {
  const [news, setNews] = useState<MarketNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMarketNews = async () => {
    try {
      setLoading(true);
      
      // Using NewsAPI (free tier) - you can replace with any free news API
      // For demo purposes, using a public news API
      const response = await fetch('/api/news?category=business&limit=5');
      const result = await response.json();
      
      if (result.success && result.data) {
        setNews(result.data);
      } else {
        // Fallback to mock data if API fails
        setNews(getFallbackNews());
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching market news:', error);
      setNews(getFallbackNews());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackNews = (): MarketNews[] => {
    return [
      {
        title: "Federal Reserve Signals Potential Rate Cuts in 2024",
        description: "The Federal Reserve indicated a more dovish stance, suggesting potential interest rate cuts could be on the horizon as inflation continues to moderate.",
        url: "https://example.com/fed-rate-cuts-2024",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: "Financial Times",
        sentiment: "positive"
      },
      {
        title: "Tech Stocks Rally on Strong Earnings Reports",
        description: "Major technology companies reported better-than-expected quarterly earnings, driving a broad market rally in the tech sector.",
        url: "https://example.com/tech-stocks-rally",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: "Reuters",
        sentiment: "positive"
      },
      {
        title: "Oil Prices Decline Amid Global Economic Concerns",
        description: "Crude oil prices fell as investors weighed concerns about global economic growth and its impact on energy demand.",
        url: "https://example.com/oil-prices-decline",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: "Bloomberg",
        sentiment: "negative"
      },
      {
        title: "Cryptocurrency Market Shows Signs of Recovery",
        description: "Bitcoin and other major cryptocurrencies gained ground as institutional adoption continues to grow.",
        url: "https://example.com/crypto-recovery",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: "CoinDesk",
        sentiment: "positive"
      }
    ];
  };

  useEffect(() => {
    fetchMarketNews();
    
    // Refresh news every 30 minutes
    const interval = setInterval(fetchMarketNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    if (sentiment === 'positive') return <TrendingUp className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 border border-light-200 dark:border-dark-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-[#24A0ED]" />
          <h3 className="font-semibold text-black dark:text-white">Market News</h3>
        </div>
        <button
          onClick={fetchMarketNews}
          disabled={loading}
          className="p-1 hover:bg-light-200 dark:hover:bg-dark-200 rounded transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-black/60 dark:text-white/60 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-light-200 dark:bg-dark-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-light-200 dark:bg-dark-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-light-200 dark:bg-dark-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {news.map((item, index) => (
              <div key={index} className="border-b border-light-200 dark:border-dark-200 pb-3 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-black dark:text-white line-clamp-2 flex-1 mr-2">
                    {item.title}
                  </h4>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#24A0ED] hover:text-[#1a7bb8] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-xs text-black/70 dark:text-white/70 mb-2 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-black/50 dark:text-white/50">
                      {item.source}
                    </span>
                    {item.sentiment && (
                      <div className={`flex items-center space-x-1 text-xs ${getSentimentColor(item.sentiment)}`}>
                        {getSentimentIcon(item.sentiment)}
                        <span className="capitalize">{item.sentiment}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {formatTimeAgo(item.publishedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-black/50 dark:text-white/50 text-center pt-3 border-t border-light-200 dark:border-dark-200 mt-4">
            Last updated: {lastUpdated.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MarketNewsWidget;
