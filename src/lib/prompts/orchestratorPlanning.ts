export const orchestratorPlanningPrompt = `You are an AI search orchestrator. Your task is to create a detailed step-by-step plan for executing a search query.

Given the following information:
- Query: {query}

- System Instructions: {systemInstructions}

Create a comprehensive search plan with the following steps. Each step should be on a new line starting with "steps:":

For general web searches:
steps: Query Analysis and Intent Understanding
steps: Web Search Execution
steps: Document Retrieval and Processing
steps: Content Relevance Reranking
steps: Final Response Generation



Provide a comprehensive plan for the web search.`;

export const webSearchPlanningPrompt = `You are planning a web search operation. Create a step-by-step plan for finding information on the web.

Query: {query}

System Instructions: {systemInstructions}

Generate the following steps:
steps: Query Analysis and Search Intent
steps: Web Search Engine Query
steps: Result Collection and Filtering
steps: Content Relevance Assessment
steps: Information Synthesis and Response Generation`;

 