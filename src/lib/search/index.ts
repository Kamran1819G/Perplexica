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

// Keep the old handlers for backward compatibility during transition
import MetaSearchAgent from '@/lib/search/metaSearchAgent';
import prompts from '../prompts';

export const searchHandlers: Record<string, MetaSearchAgent> = {
  quickSearch: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: prompts.quickSearchRetrieverPrompt,
    responsePrompt: prompts.quickSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: true,
  }),
};
