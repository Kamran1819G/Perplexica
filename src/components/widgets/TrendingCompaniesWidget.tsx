'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Building2, RefreshCw } from 'lucide-react';

interface TrendingCompany {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  trend: 'up' | 'down' | 'neutral';
  volume?: string;
  marketCap?: string;
}

const TrendingCompaniesWidget: React.FC = () => {
  const [companies, setCompanies] = useState<TrendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTrendingCompanies = async () => {
    try {
      setLoading(true);
      
      // Fetch trending companies data from our API route
      const response = await fetch('/api/market-data?type=stocks');
      const result = await response.json();
      
      if (result.success && result.data.stocks) {
        // Filter for popular tech companies
        const techCompanies = result.data.stocks.filter((stock: any) => 
          ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'].includes(stock.symbol)
        );
        
        if (techCompanies.length > 0) {
          setCompanies(techCompanies);
        } else {
          setCompanies(getFallbackCompanies());
        }
      } else {
        setCompanies(getFallbackCompanies());
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching trending companies:', error);
      setCompanies(getFallbackCompanies());
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (symbol: string): string => {
    const companyNames: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corporation',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'PLTR': 'Palantir Technologies Inc.',
      'AMD': 'Advanced Micro Devices Inc.',
      'CRM': 'Salesforce Inc.',
      'ADBE': 'Adobe Inc.'
    };
    return companyNames[symbol] || symbol;
  };

  const getFallbackCompanies = (): TrendingCompany[] => {
    return [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: '$185.92',
        change: '+$2.45',
        changePercent: '+1.33%',
        trend: 'up',
        volume: '45.2M'
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        price: '$378.85',
        change: '+$1.23',
        changePercent: '+0.33%',
        trend: 'up',
        volume: '22.1M'
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: '$142.56',
        change: '-$0.67',
        changePercent: '-0.47%',
        trend: 'down',
        volume: '18.9M'
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: '$248.42',
        change: '+$5.23',
        changePercent: '+2.15%',
        trend: 'up',
        volume: '89.7M'
      }
    ];
  };

  useEffect(() => {
    fetchTrendingCompanies();
    
    // Refresh data every 10 minutes
    const interval = setInterval(fetchTrendingCompanies, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTrendingCompanies]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 border border-light-200 dark:border-dark-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-[#24A0ED]" />
          <h3 className="font-semibold text-black dark:text-white">Trending Companies</h3>
        </div>
        <button
          onClick={fetchTrendingCompanies}
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
          <div className="space-y-3">
            {companies.map((company, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-light-100 dark:bg-dark-100 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium text-black dark:text-white">{company.name}</div>
                  <div className="text-xs text-black/60 dark:text-white/60">{company.symbol}</div>
                  {company.volume && (
                    <div className="text-xs text-black/50 dark:text-white/50">Vol: {company.volume}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-black dark:text-white">{company.price}</div>
                  <div className={`text-xs flex items-center ${company.trend === 'up' ? 'text-green-500' : company.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                    {company.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                    {company.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {company.changePercent}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-black/50 dark:text-white/50 text-center pt-3 border-t border-light-200 dark:border-dark-200 mt-3">
            Last updated: {formatTime(lastUpdated)}
          </div>
        </>
      )}
    </div>
  );
};

export default TrendingCompaniesWidget;
