# Search Orchestrator

## Overview

The Search Orchestrator is a new implementation that replaces the previous MetaSearchAgent with a planning and execution approach. It provides better visibility into the search process by showing step-by-step execution in the UI.

## Features

### 1. Planning Phase
- Analyzes the user query and focus mode
- Creates a detailed step-by-step search plan
- Estimates execution time and priority
- Shows planning progress in the UI

### 2. Execution Phase
- Executes each step in the plan sequentially
- Provides real-time updates on step status
- Shows execution time for each step
- Handles errors gracefully with detailed error messages

### 3. UI Integration
- Displays search steps in the "Steps" tab
- Shows step status (pending, running, completed, failed)
- Provides execution time for each step
- Real-time updates during execution

## Architecture

### Core Components

1. **SearchOrchestrator** (`src/lib/search/orchestrator.ts`)
   - Main orchestrator class
   - Handles planning and execution
   - Manages step lifecycle

2. **Orchestrator Handlers** (`src/lib/search/orchestratorHandlers.ts`)
   - Configuration for different search modes
   - Specialized planning prompts for each mode

3. **Planning Prompts** (`src/lib/prompts/orchestratorPlanning.ts`)
   - Specialized prompts for different search types
   - Step generation based on focus mode

4. **SearchSteps Component** (`src/components/SearchSteps.tsx`)
   - UI component for displaying steps
   - Real-time status updates
   - Progress tracking

### Search Modes

1. **Web Search**
   - Query Analysis and Intent Understanding
   - Web Search Execution
   - Document Retrieval and Processing
   - Content Relevance Reranking
   - Final Response Generation

2. **Academic Search**
   - Academic Query Analysis
   - Academic Database Search
   - Research Paper Retrieval
   - Academic Content Reranking
   - Academic Response Generation

3. **YouTube Search**
   - Video Search Query Analysis
   - YouTube Platform Search
   - Video Content Collection
   - Video Relevance Assessment
   - Video Summary Generation

4. **Reddit Search**
   - Reddit Query Analysis
   - Reddit Community Search
   - Discussion Thread Collection
   - Community Response Evaluation
   - Reddit Discussion Summary

5. **Wolfram Alpha Search**
   - Computational Query Analysis
   - Wolfram Alpha Computation
   - Mathematical Result Processing
   - Computational Accuracy Verification
   - Mathematical Response Generation

6. **Writing Assistant**
   - Writing Task Analysis
   - Content Research and Gathering
   - Writing Structure Planning
   - Content Generation and Refinement
   - Final Writing Output

## API Changes

### Search API Response

The search API now returns additional orchestrator data:

```json
{
  "message": "Generated response",
  "sources": [...],
  "plan": {
    "query": "user query",
    "focusMode": "webSearch",
    "steps": [...],
    "estimatedDuration": 10,
    "priority": "medium"
  },
  "steps": [...],
  "orchestrator": true
}
```

### Stream Events

The streaming API now supports additional event types:

- `planning`: Planning phase started
- `plan`: Search plan generated
- `execution`: Execution phase started
- `stepUpdate`: Step status update
- `error`: Error during execution

## Migration from MetaSearchAgent

The orchestrator is designed to be a drop-in replacement for the existing MetaSearchAgent:

1. **Backward Compatibility**: Old handlers are still available during transition
2. **Gradual Migration**: Can be enabled per search mode
3. **Same API Interface**: Uses the same API endpoints
4. **Enhanced UI**: Provides better visibility into the search process

## Configuration

### Environment Variables

No additional environment variables are required. The orchestrator uses the same configuration as the existing search system.

### Customization

To customize the orchestrator for a specific search mode:

1. Add a new planning prompt in `src/lib/prompts/orchestratorPlanning.ts`
2. Create a new handler in `src/lib/search/orchestratorHandlers.ts`
3. Update the search API to use the new handler

## Testing

Use the test script to verify the orchestrator is working:

```bash
node test-orchestrator.js
```

## Benefits

1. **Better Visibility**: Users can see exactly what steps are being executed
2. **Improved Debugging**: Clear error messages and step-by-step execution
3. **Enhanced UX**: Real-time progress updates and execution time tracking
4. **Modular Design**: Easy to add new search modes and customize steps
5. **Performance Monitoring**: Track execution time for optimization

## Future Enhancements

1. **Parallel Execution**: Execute independent steps in parallel
2. **Step Dependencies**: Define step dependencies and execution order
3. **Custom Steps**: Allow users to define custom search steps
4. **Step Templates**: Predefined step templates for common search patterns
5. **Performance Analytics**: Track and optimize step execution times 