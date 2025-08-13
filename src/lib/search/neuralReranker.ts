import { Embeddings } from '@langchain/core/embeddings';
import { Document } from 'langchain/document';
import computeSimilarity from '../utils/computeSimilarity';

export interface RerankedDocument extends Document {
  relevanceScore: number;
  originalRank: number;
}

export interface RerankingConfig {
  threshold: number;
  maxDocuments: number;
  diversityBoost: boolean;
  semanticWeight: number;
  keywordWeight: number;
}

export class NeuralReranker {
  private config: RerankingConfig;

  constructor(config: Partial<RerankingConfig> = {}) {
    this.config = {
      threshold: 0.3,
      maxDocuments: 50,
      diversityBoost: true,
      semanticWeight: 0.7,
      keywordWeight: 0.3,
      ...config
    };
  }

  async rerankDocuments(
    query: string,
    documents: Document[],
    embeddings: Embeddings,
    fileIds: string[] = []
  ): Promise<RerankedDocument[]> {
    if (documents.length === 0) return [];

    // Calculate semantic similarity scores
    const queryEmbedding = await embeddings.embedQuery(query);
    const semanticScores = await Promise.all(
      documents.map(async (doc, index) => {
        const docEmbedding = await embeddings.embedQuery(doc.pageContent);
        const similarity = computeSimilarity(queryEmbedding, docEmbedding);
        return { index, score: similarity };
      })
    );

    // Calculate keyword relevance scores
    const keywordScores = this.calculateKeywordScores(query, documents);

    // Combine scores with configurable weights
    const combinedScores = semanticScores.map((semantic, i) => ({
      index: semantic.index,
      score: (semantic.score * this.config.semanticWeight) + 
             (keywordScores[i] * this.config.keywordWeight)
    }));

    // Sort by combined score
    combinedScores.sort((a, b) => b.score - a.score);

    // Apply threshold filtering
    const filteredScores = combinedScores.filter(
      item => item.score >= this.config.threshold
    );

    // Apply diversity boost if enabled
    let finalScores = filteredScores;
    if (this.config.diversityBoost) {
      finalScores = this.applyDiversityBoost(documents, filteredScores);
    }

    // Limit to max documents
    finalScores = finalScores.slice(0, this.config.maxDocuments);

    // Convert to reranked documents
    return finalScores.map((score, rank) => ({
      ...documents[score.index],
      relevanceScore: score.score,
      originalRank: score.index,
      metadata: {
        ...documents[score.index].metadata,
        relevanceScore: score.score,
        rank: rank + 1
      }
    }));
  }

  private calculateKeywordScores(query: string, documents: Document[]): number[] {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    return documents.map(doc => {
      const content = doc.pageContent.toLowerCase();
      let score = 0;
      
      queryWords.forEach(word => {
        const wordCount = (content.match(new RegExp(word, 'g')) || []).length;
        score += wordCount * 0.1;
      });
      
      // Normalize score
      return Math.min(score, 1.0);
    });
  }

  private applyDiversityBoost(
    documents: Document[], 
    scores: Array<{ index: number; score: number }>
  ): Array<{ index: number; score: number }> {
    const result: Array<{ index: number; score: number }> = [];
    const usedDomains = new Set<string>();
    
    // First pass: add high-scoring documents from different domains
    scores.forEach(score => {
      const doc = documents[score.index];
      const domain = this.extractDomain(doc.metadata?.url || '');
      
      if (!usedDomains.has(domain) || result.length < 10) {
        result.push(score);
        usedDomains.add(domain);
      }
    });
    
    // Second pass: add remaining high-scoring documents
    scores.forEach(score => {
      if (!result.find(r => r.index === score.index)) {
        result.push(score);
      }
    });
    
    return result;
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }

  updateConfig(newConfig: Partial<RerankingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

