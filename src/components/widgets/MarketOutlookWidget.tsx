'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, BarChart3, Coins, Globe } from 'lucide-react';
import MarketDataService, { MarketData, CryptoData, MarketSentiment } from '@/lib/services/marketData';

const MarketOutlookWidget: React.FC = () => {
  const [stockData, setStockData] = useState<MarketData[]>([]);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [forexData, setForexData] = useState<MarketData[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto' | 'forex'>('stocks');

  const marketService = MarketDataService.getInstance();

  const fetchAllMarketData = async () => {
    try {
      setLoading(true);
      
      // Fetch all market data from our API route
      const response = await fetch('/api/market-data?type=all');
      const result = await response.json();
      
      if (result.success) {
        setStockData(result.data.stocks || []);
        setCryptoData(result.data.crypto || []);
        setForexData(result.data.forex || []);
        setSentiment(result.data.sentiment || null);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch market data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMarketData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchAllMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCryptoData = (crypto: CryptoData): MarketData => ({
    symbol: crypto.symbol.toUpperCase(),
    name: crypto.name,
    price: `$${crypto.current_price.toLocaleString()}`,
    change: crypto.price_change_percentage_24h > 0 ? '+' : '',
    changePercent: `${crypto.price_change_percentage_24h > 0 ? '+' : ''}${crypto.price_change_percentage_24h.toFixed(2)}%`,
    trend: crypto.price_change_percentage_24h > 0 ? 'up' : crypto.price_change_percentage_24h < 0 ? 'down' : 'neutral',
    marketCap: `$${(crypto.market_cap / 1000000000).toFixed(1)}B`
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getSentimentColor = (index: number) => {
    if (index >= 0 && index <= 25) return 'text-red-500';
    if (index > 25 && index <= 45) return 'text-orange-500';
    if (index > 45 && index <= 55) return 'text-yellow-500';
    if (index > 55 && index <= 75) return 'text-green-500';
    return 'text-green-600';
  };

  const getSentimentLabel = (index: number) => {
    if (index >= 0 && index <= 25) return 'Extreme Fear';
    if (index > 25 && index <= 45) return 'Fear';
    if (index > 45 && index <= 55) return 'Neutral';
    if (index > 55 && index <= 75) return 'Greed';
    return 'Extreme Greed';
  };

  const renderMarketItem = (item: MarketData, showVolume: boolean = false) => (
    <div key={item.symbol} className="flex items-center justify-between p-2 bg-light-100 dark:bg-dark-100 rounded">
      <div className="flex-1">
        <div className="text-sm font-medium text-black dark:text-white">{item.name}</div>
        <div className="text-xs text-black/60 dark:text-white/60">{item.symbol}</div>
        {showVolume && item.volume && (
          <div className="text-xs text-black/50 dark:text-white/50">Vol: {item.volume}</div>
        )}
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-black dark:text-white">{item.price}</div>
        <div className={`text-xs flex items-center ${item.trend === 'up' ? 'text-green-500' : item.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
          {item.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
          {item.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
          {item.changePercent}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 border border-light-200 dark:border-dark-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-[#24A0ED]" />
          <h3 className="font-semibold text-black dark:text-white">Market Outlook</h3>
        </div>
        <button
          onClick={fetchAllMarketData}
          disabled={loading}
          className="p-1 hover:bg-light-200 dark:hover:bg-dark-200 rounded transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-black/60 dark:text-white/60 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-light-200 dark:bg-dark-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-light-200 dark:bg-dark-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-4 bg-light-100 dark:bg-dark-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('stocks')}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'stocks' 
                  ? 'bg-white dark:bg-dark-200 text-black dark:text-white shadow-sm' 
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Stocks</span>
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'crypto' 
                  ? 'bg-white dark:bg-dark-200 text-black dark:text-white shadow-sm' 
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>Crypto</span>
            </button>
            <button
              onClick={() => setActiveTab('forex')}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'forex' 
                  ? 'bg-white dark:bg-dark-200 text-black dark:text-white shadow-sm' 
                  : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Forex</span>
            </button>
          </div>

          {/* Market Data Content */}
          <div className="space-y-2 mb-4">
            {activeTab === 'stocks' && stockData.map(item => renderMarketItem(item, true))}
            {activeTab === 'crypto' && cryptoData.map(crypto => renderMarketItem(formatCryptoData(crypto)))}
            {activeTab === 'forex' && forexData.map(item => renderMarketItem(item))}
          </div>

          {/* Market Sentiment */}
          {sentiment && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-black/70 dark:text-white/70 mb-2">Market Sentiment</h4>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-center">
                  <div className="text-xs text-green-600 dark:text-green-400">Bullish</div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">{sentiment.bullish}%</div>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
                  <div className="text-xs text-red-600 dark:text-red-400">Bearish</div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-300">{sentiment.bearish}%</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-900/20 rounded text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Neutral</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{sentiment.neutral}%</div>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs font-medium ${getSentimentColor(sentiment.fearGreedIndex)}`}>
                  Fear & Greed: {sentiment.fearGreedIndex} ({getSentimentLabel(sentiment.fearGreedIndex)})
                </div>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-black/50 dark:text-white/50 text-center pt-2 border-t border-light-200 dark:border-dark-200">
            Last updated: {formatTime(lastUpdated)}
          </div>
        </>
      )}
    </div>
  );
};

export default MarketOutlookWidget;
