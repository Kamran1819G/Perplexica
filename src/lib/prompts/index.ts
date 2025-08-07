import { quickSearchResponsePrompt, quickSearchRetrieverPrompt } from './quickSearch';
import {
  orchestratorPlanningPrompt,
  quickSearchPlanningPrompt,
} from './orchestratorPlanning';

const prompts = {
  quickSearchResponsePrompt,
  quickSearchRetrieverPrompt,
  // Orchestrator planning prompts
  orchestratorPlanningPrompt,
  quickSearchPlanningPrompt,
};

export default prompts;
