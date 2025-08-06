import { webSearchResponsePrompt, webSearchRetrieverPrompt } from './webSearch';
import {
  orchestratorPlanningPrompt,
  webSearchPlanningPrompt,
} from './orchestratorPlanning';

const prompts = {
  webSearchResponsePrompt,
  webSearchRetrieverPrompt,
  // Orchestrator planning prompts
  orchestratorPlanningPrompt,
  webSearchPlanningPrompt,
};

export default prompts;
