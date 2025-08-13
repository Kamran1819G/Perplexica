import { LRUCache } from 'lru-cache';

// Circuit breaker states
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  expectedErrors: string[];
  monitorInterval: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

class RetryHandler {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt === this.config.maxAttempts) {
          break;
        }

        if (!this.isRetryableError(error)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    return this.config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Error tracking and monitoring
class ErrorTracker {
  private errorCache = new LRUCache<string, { count: number; lastOccurrence: number; errors: Error[] }>({
    max: 100,
    ttl: 1000 * 60 * 60, // 1 hour
  });

  trackError(error: Error, context: string): void {
    const key = `${context}:${error.name}`;
    const existing = this.errorCache.get(key);

    if (existing) {
      existing.count++;
      existing.lastOccurrence = Date.now();
      existing.errors.push(error);
      this.errorCache.set(key, existing);
    } else {
      this.errorCache.set(key, {
        count: 1,
        lastOccurrence: Date.now(),
        errors: [error],
      });
    }
  }

  getErrorStats(): Record<string, { count: number; lastOccurrence: number }> {
    const stats: Record<string, any> = {};
    for (const [key, value] of this.errorCache.entries()) {
      stats[key] = {
        count: value.count,
        lastOccurrence: value.lastOccurrence,
      };
    }
    return stats;
  }
}

// Global instances
export const errorTracker = new ErrorTracker();

// Pre-configured circuit breakers
export const circuitBreakers = {
  searxng: new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
    expectedErrors: ['timeout', 'network', 'connection'],
    monitorInterval: 10000,
  }),
  llm: new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 60000, // 1 minute
    expectedErrors: ['rate limit', 'quota', 'service unavailable'],
    monitorInterval: 15000,
  }),
  embedding: new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 45000, // 45 seconds
    expectedErrors: ['timeout', 'service unavailable'],
    monitorInterval: 12000,
  }),
};

// Pre-configured retry handlers
export const retryHandlers = {
  search: new RetryHandler({
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['timeout', 'network', 'connection', 'rate limit'],
  }),
  api: new RetryHandler({
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
    retryableErrors: ['timeout', 'network', 'service unavailable'],
  }),
};

// Utility functions
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  options: {
    circuitBreaker?: CircuitBreaker;
    retryHandler?: RetryHandler;
    fallback?: () => T;
  } = {}
): Promise<T> => {
  try {
    let result: T;

    if (options.circuitBreaker) {
      result = await options.circuitBreaker.execute(operation);
    } else if (options.retryHandler) {
      result = await options.retryHandler.execute(operation);
    } else {
      result = await operation();
    }

    return result;
  } catch (error: any) {
    errorTracker.trackError(error, context);
    
    if (options.fallback) {
      console.warn(`Using fallback for ${context}:`, error.message);
      return options.fallback();
    }
    
    throw error;
  }
};

// Error classification
export const classifyError = (error: any): string => {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('timeout')) return 'TIMEOUT';
  if (message.includes('network')) return 'NETWORK';
  if (message.includes('rate limit')) return 'RATE_LIMIT';
  if (message.includes('quota')) return 'QUOTA';
  if (message.includes('service unavailable')) return 'SERVICE_UNAVAILABLE';
  if (message.includes('connection')) return 'CONNECTION';
  
  return 'UNKNOWN';
};

const errorHandling = {
  circuitBreakers,
  retryHandlers,
  errorTracker,
  withErrorHandling,
  classifyError,
};

export default errorHandling;
