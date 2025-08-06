import { orchestratorHandlers } from './orchestratorHandlers';

// Export the new orchestrator handlers
export { orchestratorHandlers };

// Keep the old handlers for backward compatibility during transition
import MetaSearchAgent from '@/lib/search/metaSearchAgent';
import prompts from '../prompts';

export const searchHandlers: Record<string, MetaSearchAgent> = {
  webSearch: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: true,
  }),
};
