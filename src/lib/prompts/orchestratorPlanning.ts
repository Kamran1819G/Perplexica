export const orchestratorPlanningPrompt = `You are an AI search orchestrator. Your task is to create a detailed step-by-step plan for executing a search query.

Given the following information:
- Query: {query}
- Focus Mode: {focusMode}
- Optimization Mode: {optimizationMode}
- System Instructions: {systemInstructions}

Create a comprehensive search plan with the following steps. Each step should be on a new line starting with "steps:":

For general web searches:
steps: Query Analysis and Intent Understanding
steps: Web Search Execution
steps: Document Retrieval and Processing
steps: Content Relevance Reranking
steps: Final Response Generation

For academic searches:
steps: Academic Query Analysis
steps: Academic Database Search
steps: Research Paper Retrieval
steps: Academic Content Reranking
steps: Academic Response Generation

For specialized searches (YouTube, Reddit, etc.):
steps: Specialized Query Analysis
steps: Platform-Specific Search
steps: Content Retrieval and Processing
steps: Relevance Assessment
steps: Specialized Response Generation

For writing assistance:
steps: Writing Task Analysis
steps: Content Research and Gathering
steps: Writing Structure Planning
steps: Content Generation and Refinement
steps: Final Writing Output

Consider the optimization mode:
- Speed: Focus on essential steps, minimize processing
- Balanced: Include all relevant steps with moderate processing
- Quality: Include comprehensive steps with thorough processing

Provide a plan that is appropriate for the given focus mode and optimization level.`;

export const webSearchPlanningPrompt = `You are planning a web search operation. Create a step-by-step plan for finding information on the web.

Query: {query}
Optimization Mode: {optimizationMode}
System Instructions: {systemInstructions}

Generate the following steps:
steps: Query Analysis and Search Intent
steps: Web Search Engine Query
steps: Result Collection and Filtering
steps: Content Relevance Assessment
steps: Information Synthesis and Response Generation`;

export const academicSearchPlanningPrompt = `You are planning an academic search operation. Create a step-by-step plan for finding scholarly information.

Query: {query}
Optimization Mode: {optimizationMode}
System Instructions: {systemInstructions}

Generate the following steps:
steps: Academic Query Analysis
steps: Scholarly Database Search
steps: Research Paper Collection
steps: Academic Content Evaluation
steps: Scholarly Response Generation`;

export const youtubeSearchPlanningPrompt = `You are planning a YouTube search operation. Create a step-by-step plan for finding video content.

Query: {query}
Optimization Mode: {optimizationMode}
System Instructions: {systemInstructions}

Generate the following steps:
steps: Video Search Query Analysis
steps: YouTube Platform Search
steps: Video Content Collection
steps: Video Relevance Assessment
steps: Video Summary Generation`;

export const redditSearchPlanningPrompt = `You are planning a Reddit search operation. Create a step-by-step plan for finding community discussions.

Query: {query}
Optimization Mode: {optimizationMode}
System Instructions: {systemInstructions}

Generate the following steps:
steps: Reddit Query Analysis
steps: Reddit Community Search
steps: Discussion Thread Collection
steps: Community Response Evaluation
steps: Reddit Discussion Summary`;

export const wolframAlphaSearchPlanningPrompt = `You are planning a computational search operation. Create a step-by-step plan for finding mathematical and computational answers.

Query: {query}
Optimization Mode: {optimizationMode}
System Instructions: {systemInstructions}

Generate the following steps:
steps: Computational Query Analysis
steps: Wolfram Alpha Computation
steps: Mathematical Result Processing
steps: Computational Accuracy Verification
steps: Mathematical Response Generation`;

export const writingAssistantPlanningPrompt = `You are planning a writing assistance operation. Create a step-by-step plan for helping with writing tasks.

Query: {query}
Optimization Mode: {optimizationMode}
System Instructions: {systemInstructions}

Generate the following steps:
steps: Writing Task Analysis
steps: Content Research and Information Gathering
steps: Writing Structure and Outline Planning
steps: Content Generation and Writing
steps: Writing Review and Refinement`; 