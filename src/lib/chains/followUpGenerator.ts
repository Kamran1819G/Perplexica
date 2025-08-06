import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

export interface FollowUpResult {
  followUp: string;
  related: string[];
}

class FollowUpGenerator {
  async generateFollowUps(
    query: string,
    response: string,
    history: BaseMessage[],
    context: string,
    llm: BaseChatModel,
  ): Promise<FollowUpResult> {
    const followUpPrompt = `
Based on the user's query and the AI response, generate relevant follow-up questions and related topics.

User Query: {query}
AI Response: {response}
Context: {context}

Generate:
1. One main follow-up question that naturally extends the conversation
2. 3-4 related questions or topics the user might be interested in

Format your response as:
FOLLOW_UP: [main follow-up question]
RELATED:
- [related question 1]
- [related question 2]
- [related question 3]
- [related question 4]
`;

    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(followUpPrompt),
      llm,
      new StringOutputParser(),
    ]);

    try {
      const result = await chain.invoke({
        query,
        response: response.substring(0, 1000), // Limit response length
        context: context.substring(0, 1000), // Limit context length
      });

      // Parse the result
      const lines = result.split('\n').map(line => line.trim()).filter(line => line);
      let followUp = '';
      const related: string[] = [];
      
      let inRelated = false;
      for (const line of lines) {
        if (line.startsWith('FOLLOW_UP:')) {
          followUp = line.replace('FOLLOW_UP:', '').trim();
        } else if (line === 'RELATED:') {
          inRelated = true;
        } else if (inRelated && line.startsWith('-')) {
          const relatedItem = line.replace('-', '').trim();
          if (relatedItem) {
            related.push(relatedItem);
          }
        }
      }

      return {
        followUp: followUp || 'What would you like to know more about?',
        related: related.length > 0 ? related : [
          'Tell me more about this topic',
          'What are the key points?',
          'Are there any recent developments?',
          'How does this compare to alternatives?'
        ]
      };
    } catch (error) {
      console.error('Error generating follow-ups:', error);
      return {
        followUp: 'What would you like to know more about?',
        related: [
          'Tell me more about this topic',
          'What are the key points?',
          'Are there any recent developments?',
          'How does this compare to alternatives?'
        ]
      };
    }
  }
}

export default FollowUpGenerator;