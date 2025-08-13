import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Document } from 'langchain/document';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RerankedDocument } from './neuralReranker';

export interface FusionConfig {
  maxChunkSize: number;
  overlapSize: number;
  maxChunks: number;
  semanticGrouping: boolean;
  deduplication: boolean;
}

export interface ContextChunk {
  id: string;
  content: string;
  sources: string[];
  relevanceScore: number;
  metadata: Record<string, any>;
}

export class ContextualFusion {
  private config: FusionConfig;
  private chunkCache: Map<string, ContextChunk[]> = new Map();
  private groupingCache: Map<string, RerankedDocument[]> = new Map();

  constructor(config: Partial<FusionConfig> = {}) {
    this.config = {
      maxChunkSize: 2000,
      overlapSize: 200,
      maxChunks: 10,
      semanticGrouping: true,
      deduplication: true,
      ...config
    };
  }

  async createContextChunks(
    query: string,
    documents: RerankedDocument[],
    llm: BaseChatModel
  ): Promise<ContextChunk[]> {
    if (documents.length === 0) return [];

    // Check cache first
    const cacheKey = `${query}-${documents.length}-${JSON.stringify(this.config)}`;
    const cached = this.chunkCache.get(cacheKey);
    if (cached) return cached;

    // Fast processing - limit documents for speed
    const maxDocs = Math.min(documents.length, this.config.maxChunks * 3);
    const topDocs = documents.slice(0, maxDocs);

    // Step 1: Fast semantic grouping if enabled
    let groupedDocs = topDocs;
    if (this.config.semanticGrouping && topDocs.length > 5) {
      const groupKey = `group-${topDocs.map(d => d.metadata?.url || '').join('-')}`;
      const cachedGroup = this.groupingCache.get(groupKey);
      if (cachedGroup) {
        groupedDocs = cachedGroup;
      } else {
        groupedDocs = await this.fastGroupDocuments(topDocs);
        this.groupingCache.set(groupKey, groupedDocs);
      }
    }

    // Step 2: Create overlapping chunks
    const chunks = this.createOverlappingChunks(groupedDocs);

    // Step 3: Deduplicate if enabled
    let finalChunks = chunks;
    if (this.config.deduplication) {
      finalChunks = this.deduplicateChunks(chunks);
    }

    // Step 4: Limit to max chunks
    finalChunks = finalChunks.slice(0, this.config.maxChunks);

    // Step 5: Enhance chunks with context
    return this.enhanceChunksWithContext(query, finalChunks, llm);
  }

  private async fastGroupDocuments(documents: RerankedDocument[]): Promise<RerankedDocument[]> {
    // Fast grouping based on URL domains and titles without LLM
    const groups: Map<string, RerankedDocument[]> = new Map();
    
    documents.forEach(doc => {
      const domain = this.extractDomain(doc.metadata?.url || '');
      const titleWords = (doc.metadata?.title || '').toLowerCase().split(' ').slice(0, 3).join(' ');
      const groupKey = `${domain}-${titleWords}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(doc);
    });

    // Return best document from each group
    const groupedDocs: RerankedDocument[] = [];
    groups.forEach(group => {
      // Sort by relevance and take the best
      group.sort((a, b) => b.relevanceScore - a.relevanceScore);
      groupedDocs.push(group[0]);
    });

    return groupedDocs.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private async groupDocumentsBySemanticSimilarity(
    documents: RerankedDocument[],
    llm: BaseChatModel
  ): Promise<RerankedDocument[]> {
    if (documents.length <= 1) return documents;

    const prompt = ChatPromptTemplate.fromTemplate(`
      Analyze the following documents and group them by semantic similarity.
      Return a JSON array where each group contains document indices that are semantically related.
      
      Documents:
      {documents}
      
      Return only the JSON array, no other text.
    `);

    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser()
    ]);

    try {
      const documentsText = documents.map((doc, i) => 
        `${i}: ${doc.pageContent.substring(0, 200)}...`
      ).join('\n\n');

      const result = await chain.invoke({ documents: documentsText });
      const groups = JSON.parse(result);

      // Reorder documents based on groups
      const reordered: RerankedDocument[] = [];
      groups.forEach((group: number[]) => {
        group.forEach(index => {
          if (documents[index]) {
            reordered.push(documents[index]);
          }
        });
      });

      return reordered;
    } catch (error) {
      console.warn('Semantic grouping failed, using original order:', error);
      return documents;
    }
  }

  private createOverlappingChunks(documents: RerankedDocument[]): ContextChunk[] {
    const chunks: ContextChunk[] = [];
    let chunkId = 0;

    documents.forEach((doc, docIndex) => {
      const content = doc.pageContent;
      const words = content.split(' ');
      
      for (let i = 0; i < words.length; i += this.config.maxChunkSize - this.config.overlapSize) {
        const chunkWords = words.slice(i, i + this.config.maxChunkSize);
        const chunkContent = chunkWords.join(' ');
        
        if (chunkContent.trim().length > 100) { // Minimum chunk size
          chunks.push({
            id: `chunk_${chunkId++}`,
            content: chunkContent,
            sources: [doc.metadata?.url || `doc_${docIndex}`],
            relevanceScore: doc.relevanceScore || 0,
            metadata: {
              ...doc.metadata,
              documentIndex: docIndex,
              chunkIndex: i / (this.config.maxChunkSize - this.config.overlapSize)
            }
          });
        }
      }
    });

    return chunks;
  }

  private deduplicateChunks(chunks: ContextChunk[]): ContextChunk[] {
    const seen = new Set<string>();
    const unique: ContextChunk[] = [];

    chunks.forEach(chunk => {
      const normalized = chunk.content.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(chunk);
      }
    });

    return unique;
  }

  private async enhanceChunksWithContext(
    query: string,
    chunks: ContextChunk[],
    llm: BaseChatModel
  ): Promise<ContextChunk[]> {
    const prompt = ChatPromptTemplate.fromTemplate(`
      Enhance the following context chunk to better answer the query.
      Add relevant context, clarify ambiguous information, and ensure coherence.
      Keep the enhanced content concise and focused.
      
      Query: {query}
      Original Chunk: {chunk}
      
      Return only the enhanced content, no other text.
    `);

    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser()
    ]);

    const enhancedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const enhancedContent = await chain.invoke({
            query,
            chunk: chunk.content
          });

          return {
            ...chunk,
            content: enhancedContent.trim()
          };
        } catch (error) {
          console.warn(`Failed to enhance chunk ${chunk.id}:`, error);
          return chunk;
        }
      })
    );

    return enhancedChunks;
  }

  async mergeChunksIntoUnifiedContext(
    query: string,
    chunks: ContextChunk[],
    llm: BaseChatModel
  ): Promise<string> {
    if (chunks.length === 0) return '';

    const prompt = ChatPromptTemplate.fromTemplate(`
      Merge the following context chunks into a unified, coherent context that answers the query.
      Eliminate redundancy, resolve contradictions, and create a smooth narrative flow.
      Maintain all important information while ensuring logical coherence.
      
      Query: {query}
      
      Context Chunks:
      {chunks}
      
      Return only the unified context, no other text.
    `);

    const chain = RunnableSequence.from([
      prompt,
      llm,
      new StringOutputParser()
    ]);

    try {
      const chunksText = chunks.map((chunk, i) => 
        `Chunk ${i + 1}:\n${chunk.content}\n`
      ).join('\n');

      const unifiedContext = await chain.invoke({
        query,
        chunks: chunksText
      });

      return unifiedContext.trim();
    } catch (error) {
      console.error('Failed to merge chunks:', error);
      // Fallback: concatenate chunks with separators
      return chunks.map(chunk => chunk.content).join('\n\n---\n\n');
    }
  }

  updateConfig(newConfig: Partial<FusionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

