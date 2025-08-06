// Market Data Service - Uses free public APIs without API keys

export interface MarketData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  trend: 'up' | 'down' | 'neutral';
  volume?: string;
  marketCap?: string;
}

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

export interface MarketSentiment {
  bullish: number;
  bearish: number;
  neutral: number;
  fearGreedIndex: number;
}

// Free public APIs for market data
export class MarketDataService {
  private static instance: MarketDataService;
  
  public static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  // Fetch cryptocurrency data from CoinGecko (free, no API key required)
  async fetchCryptoData(limit: number = 10): Promise<CryptoData[]> {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      // Return fallback data
      return [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 45000,
          price_change_percentage_24h: 2.5,
          market_cap: 850000000000,
          total_volume: 25000000000
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 3200,
          price_change_percentage_24h: 1.8,
          market_cap: 380000000000,
          total_volume: 15000000000
        }
      ];
    }
  }

  // Fetch stock market data using Yahoo Finance API (free, no API key required)
  async fetchStockData(): Promise<MarketData[]> {
    try {
      // Using Yahoo Finance API through a public proxy
      const symbols = ['^GSPC', '^IXIC', '^DJI', '^VIX', 'GLD', 'SLV'];
      const stockData: MarketData[] = [];

      for (const symbol of symbols) {
        try {
          // Try the newer endpoint first
          let response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d&includePrePost=false`
          );
          
          // If that fails, try the older endpoint
          if (!response.ok) {
            response = await fetch(
              `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
            );
          }
          
          if (response.ok) {
            const data = await response.json();
            
            // Check if we have valid data
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
              console.warn(`No chart data available for ${symbol}`);
              continue;
            }
            
            const result = data.chart.result[0];
            const quote = result.indicators.quote[0];
            const meta = result.meta;
            
            // Debug logging
            console.log(`Data for ${symbol}:`, {
              currentPrice: meta.regularMarketPrice,
              previousClose: meta.previousClose,
              volume: quote.volume ? quote.volume[0] : 'N/A'
            });
            
            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.previousClose;
            
            // Alternative: try to get previous close from the close array if meta.previousClose is not available
            let actualPreviousClose = previousClose;
            if (!actualPreviousClose && result.indicators.quote[0].close && result.indicators.quote[0].close.length > 1) {
              actualPreviousClose = result.indicators.quote[0].close[result.indicators.quote[0].close.length - 2];
            }
            
            // Check if we have valid data for calculations
            if (currentPrice && actualPreviousClose && actualPreviousClose > 0) {
              const change = currentPrice - actualPreviousClose;
              const changePercent = (change / actualPreviousClose) * 100;
              
              stockData.push({
                symbol: symbol,
                name: this.getStockName(symbol),
                price: `$${currentPrice.toFixed(2)}`,
                change: change >= 0 ? `+$${change.toFixed(2)}` : `-$${Math.abs(change).toFixed(2)}`,
                changePercent: `${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
                trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
                volume: quote.volume ? quote.volume[0].toLocaleString() : undefined
              });
            } else {
              // Fallback when we don't have previous close data
              stockData.push({
                symbol: symbol,
                name: this.getStockName(symbol),
                price: `$${currentPrice ? currentPrice.toFixed(2) : '0.00'}`,
                change: '+$0.00',
                changePercent: '+0.00%',
                trend: 'neutral' as const,
                volume: quote.volume ? quote.volume[0].toLocaleString() : undefined
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
        }
      }

      // Filter out any items with NaN values
      const validStockData = stockData.filter(item => !item.changePercent.includes('NaN'));
      
      // If no valid data fetched, return fallback data
      if (validStockData.length === 0) {
        console.warn('Using fallback stock data due to API issues');
        return this.getFallbackStockData();
      }

      return validStockData;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return this.getFallbackStockData();
    }
  }

  // Fetch forex data from a free API
  async fetchForexData(): Promise<MarketData[]> {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const rates = data.rates;
      
      const forexData: MarketData[] = [
        {
          symbol: 'EUR/USD',
          name: 'Euro / US Dollar',
          price: rates.EUR ? `$${(1 / rates.EUR).toFixed(4)}` : '$1.0850',
          change: '+0.0023',
          changePercent: '+0.21%',
          trend: 'up'
        },
        {
          symbol: 'GBP/USD',
          name: 'British Pound / US Dollar',
          price: rates.GBP ? `$${(1 / rates.GBP).toFixed(4)}` : '$1.2650',
          change: '-0.0015',
          changePercent: '-0.12%',
          trend: 'down'
        },
        {
          symbol: 'USD/JPY',
          name: 'US Dollar / Japanese Yen',
          price: rates.JPY ? `¥${rates.JPY.toFixed(2)}` : '¥148.50',
          change: '+0.45',
          changePercent: '+0.30%',
          trend: 'up'
        }
      ];

      return forexData;
    } catch (error) {
      console.error('Error fetching forex data:', error);
      return this.getFallbackForexData();
    }
  }

  // Get market sentiment data
  async fetchMarketSentiment(): Promise<MarketSentiment> {
    try {
      // Using Fear & Greed Index API (free)
      const response = await fetch('https://api.alternative.me/fng/');
      
      if (response.ok) {
        const data = await response.json();
        const fearGreedIndex = parseInt(data.data[0].value);
        
        // Calculate sentiment based on fear & greed index
        let bullish = 0, bearish = 0, neutral = 0;
        
        if (fearGreedIndex >= 0 && fearGreedIndex <= 25) {
          bullish = 20;
          bearish = 70;
          neutral = 10;
        } else if (fearGreedIndex > 25 && fearGreedIndex <= 45) {
          bullish = 35;
          bearish = 50;
          neutral = 15;
        } else if (fearGreedIndex > 45 && fearGreedIndex <= 55) {
          bullish = 45;
          bearish = 45;
          neutral = 10;
        } else if (fearGreedIndex > 55 && fearGreedIndex <= 75) {
          bullish = 60;
          bearish = 30;
          neutral = 10;
        } else {
          bullish = 75;
          bearish = 20;
          neutral = 5;
        }
        
        return {
          bullish,
          bearish,
          neutral,
          fearGreedIndex
        };
      }
    } catch (error) {
      console.error('Error fetching market sentiment:', error);
    }
    
    // Fallback sentiment data
    return {
      bullish: 65,
      bearish: 25,
      neutral: 10,
      fearGreedIndex: 65
    };
  }

  // Helper method to get stock names
  private getStockName(symbol: string): string {
    const stockNames: { [key: string]: string } = {
      '^GSPC': 'S&P 500',
      '^IXIC': 'NASDAQ Composite',
      '^DJI': 'Dow Jones Industrial Average',
      '^VIX': 'CBOE Volatility Index',
      'GLD': 'SPDR Gold Trust',
      'SLV': 'iShares Silver Trust'
    };
    return stockNames[symbol] || symbol;
  }

  // Fallback stock data
  private getFallbackStockData(): MarketData[] {
    return [
      {
        symbol: '^GSPC',
        name: 'S&P 500',
        price: '$6,329.94',
        change: '+$15.67',
        changePercent: '+0.25%',
        trend: 'up',
        volume: '4.8B'
      },
      {
        symbol: '^IXIC',
        name: 'NASDAQ Composite',
        price: '$21,053.58',
        change: '+$42.31',
        changePercent: '+0.20%',
        trend: 'up',
        volume: '7.4B'
      },
      {
        symbol: '^DJI',
        name: 'Dow Jones Industrial Average',
        price: '$44,173.64',
        change: '-$23.45',
        changePercent: '-0.05%',
        trend: 'down',
        volume: '5.1B'
      },
      {
        symbol: '^VIX',
        name: 'CBOE Volatility Index',
        price: '$17.32',
        change: '-$0.28',
        changePercent: '-1.59%',
        trend: 'down',
        volume: 'N/A'
      },
      {
        symbol: 'GLD',
        name: 'SPDR Gold Trust',
        price: '$310.91',
        change: '+$2.15',
        changePercent: '+0.70%',
        trend: 'up',
        volume: '76.3M'
      },
      {
        symbol: 'SLV',
        name: 'iShares Silver Trust',
        price: '$33.98',
        change: '+$0.12',
        changePercent: '+0.35%',
        trend: 'up',
        volume: '97.0M'
      }
    ];
  }

  // Fallback forex data
  private getFallbackForexData(): MarketData[] {
    return [
      {
        symbol: 'EUR/USD',
        name: 'Euro / US Dollar',
        price: '$1.0850',
        change: '+0.0023',
        changePercent: '+0.21%',
        trend: 'up'
      },
      {
        symbol: 'GBP/USD',
        name: 'British Pound / US Dollar',
        price: '$1.2650',
        change: '-0.0015',
        changePercent: '-0.12%',
        trend: 'down'
      },
      {
        symbol: 'USD/JPY',
        name: 'US Dollar / Japanese Yen',
        price: '¥148.50',
        change: '+0.45',
        changePercent: '+0.30%',
        trend: 'up'
      }
    ];
  }
}

export default MarketDataService; 