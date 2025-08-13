import { NextRequest, NextResponse } from 'next/server';
import { getSystemHealth } from '@/lib/performance';
import CacheManager from '@/lib/cache';
import { errorTracker } from '@/lib/errorHandling';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    const healthData: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.11.0-rc1',
      environment: process.env.NODE_ENV || 'development',
    };

    if (detailed) {
      // Get detailed system metrics
      const systemHealth = getSystemHealth();
      const cacheStats = CacheManager.getStats();
      const errorStats = errorTracker.getErrorStats();

      Object.assign(healthData, {
        memory: systemHealth.memory,
        performance: systemHealth.performance,
        cache: cacheStats,
        errors: errorStats,
        slowestOperations: systemHealth.slowestOperations,
        errorRates: systemHealth.errorRates,
        memoryPressure: systemHealth.memoryPressure,
      });

      // Check for critical issues
      if (systemHealth.memoryPressure) {
        healthData.status = 'warning';
        healthData.warnings = ['High memory usage detected'];
      }

      const highErrorRates = Object.entries(systemHealth.errorRates)
        .filter(([_, rate]) => rate > 0.1) // 10% error rate threshold
        .map(([operation, rate]) => `${operation}: ${(rate * 100).toFixed(1)}%`);

      if (highErrorRates.length > 0) {
        healthData.status = 'warning';
        healthData.warnings = [...(healthData.warnings || []), `High error rates: ${highErrorRates.join(', ')}`];
      }
    }

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
