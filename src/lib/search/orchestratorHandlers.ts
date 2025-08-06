import SearchOrchestrator from './orchestrator';
import prompts from '../prompts';

export const orchestratorHandlers: Record<string, SearchOrchestrator> = {
  webSearch: new SearchOrchestrator({
    activeEngines: [],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: true,
    planningPrompt: prompts.webSearchPlanningPrompt,
  }),
}; 