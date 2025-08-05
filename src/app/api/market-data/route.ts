import { NextRequest, NextResponse } from 'next/server';
import MarketDataService from '@/lib/services/marketData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    const marketService = MarketDataService.getInstance();
    
    let data: any = {};
    
    switch (type) {
      case 'stocks':
        data.stocks = await marketService.fetchStockData();
        break;
      case 'crypto':
        data.crypto = await marketService.fetchCryptoData(10);
        break;
      case 'forex':
        data.forex = await marketService.fetchForexData();
        break;
      case 'sentiment':
        data.sentiment = await marketService.fetchMarketSentiment();
        break;
      case 'all':
      default:
        const [stocks, crypto, forex, sentiment] = await Promise.all([
          marketService.fetchStockData(),
          marketService.fetchCryptoData(10),
          marketService.fetchForexData(),
          marketService.fetchMarketSentiment()
        ]);
        data = { stocks, crypto, forex, sentiment };
        break;
    }
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in market data API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 