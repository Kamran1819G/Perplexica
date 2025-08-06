import {
  academicSearchResponsePrompt,
  academicSearchRetrieverPrompt,
} from './academicSearch';
import {
  redditSearchResponsePrompt,
  redditSearchRetrieverPrompt,
} from './redditSearch';
import { webSearchResponsePrompt, webSearchRetrieverPrompt } from './webSearch';
import {
  wolframAlphaSearchResponsePrompt,
  wolframAlphaSearchRetrieverPrompt,
} from './wolframAlpha';
import { writingAssistantPrompt } from './writingAssistant';
import {
  youtubeSearchResponsePrompt,
  youtubeSearchRetrieverPrompt,
} from './youtubeSearch';
import {
  orchestratorPlanningPrompt,
  webSearchPlanningPrompt,
  academicSearchPlanningPrompt,
  youtubeSearchPlanningPrompt,
  redditSearchPlanningPrompt,
  wolframAlphaSearchPlanningPrompt,
  writingAssistantPlanningPrompt,
} from './orchestratorPlanning';

export default {
  webSearchResponsePrompt,
  webSearchRetrieverPrompt,
  academicSearchResponsePrompt,
  academicSearchRetrieverPrompt,
  redditSearchResponsePrompt,
  redditSearchRetrieverPrompt,
  wolframAlphaSearchResponsePrompt,
  wolframAlphaSearchRetrieverPrompt,
  writingAssistantPrompt,
  youtubeSearchResponsePrompt,
  youtubeSearchRetrieverPrompt,
  // Orchestrator planning prompts
  orchestratorPlanningPrompt,
  webSearchPlanningPrompt,
  academicSearchPlanningPrompt,
  youtubeSearchPlanningPrompt,
  redditSearchPlanningPrompt,
  wolframAlphaSearchPlanningPrompt,
  writingAssistantPlanningPrompt,
};
