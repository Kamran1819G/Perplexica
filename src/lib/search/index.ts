import { orchestratorHandlers } from './orchestratorHandlers';
import { SearchOrchestrator } from './orchestrator';
import { NeuralReranker } from './neuralReranker';
import { ContextualFusion } from './contextualFusion';
import { SearxngClient } from '../searxng';
import { searchConfigs, getSearchConfig, createSearchOrchestrator } from './config';

// Export the orchestrator handlers
export { orchestratorHandlers };

// Export the new orchestrator and components
export { 
  SearchOrchestrator,
  NeuralReranker,
  ContextualFusion,
  SearxngClient
};

// Export configuration and utilities
export {
  searchConfigs,
  getSearchConfig,
  createSearchOrchestrator
};

// Note: Old MetaSearchAgent handlers removed - now using SearchOrchestrator for all search modes
