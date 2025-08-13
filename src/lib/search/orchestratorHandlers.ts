import { NeuralReranker } from './neuralReranker';
import { ContextualFusion } from './contextualFusion';
import { SearchOrchestrator } from './orchestrator';
import { getSearchConfig } from './config';

// Initialize shared components
const neuralReranker = new NeuralReranker();
const contextualFusion = new ContextualFusion();

// Create orchestrator instances using the new SearchOrchestrator
const quickSearch = new SearchOrchestrator(getSearchConfig('quickSearch'));
const proSearch = new SearchOrchestrator(getSearchConfig('proSearch'));
const ultraSearch = new SearchOrchestrator(getSearchConfig('ultraSearch'));

export const orchestratorHandlers: Record<string, SearchOrchestrator> = {
  quickSearch,
  proSearch,
  ultraSearch,
};

// Export shared components for use in other parts of the system
export { neuralReranker, contextualFusion, quickSearch, proSearch, ultraSearch };