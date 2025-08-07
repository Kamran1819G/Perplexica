import { performance } from 'perf_hooks';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  totalCalls: number;
  errorRate: number;
  p95: number;
  p99: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics
  private errorCounts: Record<string, number> = {};

  trackOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const startTimestamp = Date.now();

    return fn()
      .then((result) => {
        const duration = performance.now() - startTime;
        this.recordMetric(operation, duration, startTimestamp, metadata);
        return result;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        this.recordMetric(operation, duration, startTimestamp, { ...metadata, error: true });
        this.recordError(operation);
        throw error;
      });
  }

  private recordMetric(
    operation: string,
    duration: number,
    timestamp: number,
    metadata?: Record<string, any>
  ): void {
    this.metrics.push({
      operation,
      duration,
      timestamp,
      metadata,
    });

    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private recordError(operation: string): void {
    this.errorCounts[operation] = (this.errorCounts[operation] || 0) + 1;
  }

  getStats(operation?: string, timeWindow?: number): Record<string, PerformanceStats> {
    const now = Date.now();
    const windowMs = timeWindow || 24 * 60 * 60 * 1000; // Default 24 hours

    const filteredMetrics = this.metrics.filter(
      (metric) =>
        (!operation || metric.operation === operation) &&
        (now - metric.timestamp) <= windowMs
    );

    const statsByOperation: Record<string, PerformanceStats> = {};
    const operationGroups = this.groupBy(filteredMetrics, 'operation');

    for (const [op, metrics] of Object.entries(operationGroups)) {
      const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
      const errorCount = metrics.filter((m) => m.metadata?.error).length;
      const totalCalls = metrics.length;

      statsByOperation[op] = {
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        totalCalls,
        errorRate: totalCalls > 0 ? errorCount / totalCalls : 0,
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99),
      };
    }

    return statsByOperation;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  getSlowestOperations(limit: number = 10): Array<{ operation: string; avgDuration: number }> {
    const stats = this.getStats();
    return Object.entries(stats)
      .map(([operation, stat]) => ({ operation, avgDuration: stat.avgDuration }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  getErrorRates(): Record<string, number> {
    const stats = this.getStats();
    const errorRates: Record<string, number> = {};
    
    for (const [operation, stat] of Object.entries(stats)) {
      errorRates[operation] = stat.errorRate;
    }
    
    return errorRates;
  }

  clear(): void {
    this.metrics = [];
    this.errorCounts = {};
  }
}

// Memory monitoring
class MemoryMonitor {
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  getMemoryStats(): {
    heapUsed: string;
    heapTotal: string;
    external: string;
    rss: string;
    heapUsagePercent: number;
  } {
    const usage = this.getMemoryUsage();
    const mb = 1024 * 1024;

    return {
      heapUsed: `${Math.round(usage.heapUsed / mb)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / mb)} MB`,
      external: `${Math.round(usage.external / mb)} MB`,
      rss: `${Math.round(usage.rss / mb)} MB`,
      heapUsagePercent: Math.round((usage.heapUsed / usage.heapTotal) * 100),
    };
  }

  isMemoryPressure(): boolean {
    const usage = this.getMemoryUsage();
    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;
    return heapUsagePercent > 80; // 80% threshold
  }
}

// Database performance monitoring
class DatabaseMonitor {
  private queryMetrics: Array<{
    query: string;
    duration: number;
    timestamp: number;
    success: boolean;
  }> = [];

  trackQuery<T>(
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const timestamp = Date.now();

    return fn()
      .then((result) => {
        const duration = performance.now() - startTime;
        this.recordQuery(query, duration, timestamp, true);
        return result;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        this.recordQuery(query, duration, timestamp, false);
        throw error;
      });
  }

  private recordQuery(query: string, duration: number, timestamp: number, success: boolean): void {
    this.queryMetrics.push({ query, duration, timestamp, success });
    
    // Keep only last 1000 queries
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  getSlowQueries(limit: number = 10): Array<{ query: string; avgDuration: number; count: number }> {
    const queryGroups = this.queryMetrics.reduce((groups, metric) => {
      if (!groups[metric.query]) {
        groups[metric.query] = [];
      }
      groups[metric.query].push(metric);
      return groups;
    }, {} as Record<string, typeof this.queryMetrics>);

    return Object.entries(queryGroups)
      .map(([query, metrics]) => ({
        query,
        avgDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
        count: metrics.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }
}

// Global instances
export const performanceMonitor = new PerformanceMonitor();
export const memoryMonitor = new MemoryMonitor();
export const databaseMonitor = new DatabaseMonitor();

// Decorator for automatic performance tracking
export function trackPerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.trackOperation(
        `${target.constructor.name}.${propertyName}`,
        () => method.apply(this, args)
      );
    };
  };
}

// Utility function for tracking async operations
export const trackAsync = <T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return performanceMonitor.trackOperation(operation, fn, metadata);
};

// Health check function
export const getSystemHealth = () => {
  const memoryStats = memoryMonitor.getMemoryStats();
  const performanceStats = performanceMonitor.getStats();
  const slowestOperations = performanceMonitor.getSlowestOperations(5);
  const errorRates = performanceMonitor.getErrorRates();
  const slowQueries = databaseMonitor.getSlowQueries(5);

  return {
    memory: memoryStats,
    performance: performanceStats,
    slowestOperations,
    errorRates,
    slowQueries,
    memoryPressure: memoryMonitor.isMemoryPressure(),
    timestamp: new Date().toISOString(),
  };
};

export default {
  performanceMonitor,
  memoryMonitor,
  databaseMonitor,
  trackPerformance,
  trackAsync,
  getSystemHealth,
};
