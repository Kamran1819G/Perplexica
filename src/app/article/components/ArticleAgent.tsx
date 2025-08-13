'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  MessageCircle,
  BarChart3,
  FileText,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { NewsArticle } from '@/lib/news/types';

interface ArticleAgentProps {
  article: NewsArticle;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const ArticleAgent: React.FC<ArticleAgentProps> = ({ article, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'agent',
      content: `Hi! I'm your AI assistant for this article about "${article.title}". I can help you understand the content, provide context, answer questions, or explain complex topics. What would you like to know?`,
      timestamp: new Date(),
      suggestions: [
        'Summarize key points',
        'Explain the context',
        'Check for bias',
        'Find related topics'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const agentResponse = generateAgentResponse(content);
      setMessages(prev => [...prev, agentResponse]);
      setLoading(false);
    }, 1500);
  };

  const generateAgentResponse = (userQuery: string): ChatMessage => {
    const query = userQuery.toLowerCase();
    let response = '';
    let suggestions: string[] = [];

    if (query.includes('summarize') || query.includes('summary') || query.includes('key points')) {
      response = `Here are the key points from this article:

• **Main Topic**: ${article.topics[0] || 'General News'}
• **Source**: ${article.source.name} (${article.source.credibility} credibility)
• **Quality Score**: ${article.qualityScore}/100

${article.summary || 'This article discusses ' + article.title.toLowerCase() + '. The content covers important developments and their implications.'}

The article appears to have ${article.sentiment || 'neutral'} sentiment and ${article.bias || 'unknown'} political bias.`;
      
      suggestions = ['Explain context', 'Check sources', 'Find similar articles', 'Analyze bias'];
    } 
    else if (query.includes('context') || query.includes('background')) {
      response = `Context for this article:

**Topic Background**: ${article.topics.join(', ')} are important areas that impact various stakeholders.

**Source Analysis**: ${article.source.name} is rated as ${article.source.credibility} credibility. This affects how we should interpret the information.

**Timing**: Published ${new Date(article.publishedAt).toLocaleDateString()}, which is relevant for understanding the current state of this topic.

**Quality Indicators**: With a quality score of ${article.qualityScore}/100, this article ${article.qualityScore >= 70 ? 'meets high standards' : 'should be read with some caution'}.`;
      
      suggestions = ['Check for bias', 'Find related articles', 'Verify claims', 'Ask specific questions'];
    }
    else if (query.includes('bias') || query.includes('political')) {
      response = `Bias Analysis:

**Political Bias**: ${article.bias || 'No clear political bias detected'}
**Sentiment**: ${article.sentiment || 'Neutral'} tone throughout the article
**Source Credibility**: ${article.source.credibility} - This ${article.source.credibility === 'high' ? 'is a trusted source' : article.source.credibility === 'medium' ? 'is a moderately reliable source' : 'requires additional verification'}

**Language Analysis**: The article uses ${article.sentiment === 'positive' ? 'optimistic' : article.sentiment === 'negative' ? 'critical' : 'neutral'} language when discussing the topic.

**Recommendation**: ${article.source.credibility === 'high' && (article.bias === 'center' || !article.bias) ? 'This appears to be a reliable, balanced source.' : 'Consider cross-referencing with other sources for a complete picture.'}`;
      
      suggestions = ['Find opposing views', 'Check source reputation', 'Look for fact-checks', 'Compare coverage'];
    }
    else if (query.includes('related') || query.includes('similar') || query.includes('more')) {
      response = `Related Information:

**Similar Topics**: You might be interested in other articles about ${article.topics.join(', ')}.

**Connected Issues**: This topic relates to broader themes in current events and may have implications for policy, economics, or society.

**Follow-up Questions**: Consider exploring how this development might affect different stakeholders or what expert opinions exist on this matter.

**Sources to Check**: Look for coverage from other ${article.source.credibility} credibility sources to get a comprehensive view.`;
      
      suggestions = ['Explain implications', 'Find expert opinions', 'Check recent developments', 'Compare sources'];
    }
    else {
      response = `I'd be happy to help you understand this article better! 

Based on your question about "${userQuery}", here's what I can tell you:

This article covers ${article.topics.join(', ').toLowerCase()} and was published by ${article.source.name}. The content appears to be ${article.sentiment || 'neutral'} in tone with a quality score of ${article.qualityScore}/100.

Could you be more specific about what aspect you'd like me to explain? I can help with:
- Understanding complex terms or concepts
- Providing background context
- Analyzing bias or credibility
- Finding related information
- Explaining implications`;
      
      suggestions = ['Summarize this article', 'Explain the context', 'Check for bias', 'Find related topics'];
    }

    return {
      id: Date.now().toString(),
      type: 'agent',
      content: response,
      timestamp: new Date(),
      suggestions
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-200 dark:border-dark-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-light-200 dark:border-dark-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#24A0ED] rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-black dark:text-white">AI Assistant</h3>
            <p className="text-xs text-black/60 dark:text-white/60">Article Analysis & Q&A</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-light-200 dark:hover:bg-dark-200 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-black/60 dark:text-white/60" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-64">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.type === 'user'
                ? 'bg-[#24A0ED] text-white'
                : 'bg-light-100 dark:bg-dark-100 text-black dark:text-white'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs opacity-70">Quick actions:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(suggestion)}
                        className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-light-100 dark:bg-dark-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-[#24A0ED]/30 border-t-[#24A0ED] rounded-full animate-spin"></div>
                <span className="text-sm text-black/60 dark:text-white/60">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-light-200 dark:border-dark-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this article..."
            className="flex-1 px-3 py-2 bg-light-100 dark:bg-dark-100 border border-light-200 dark:border-dark-200 rounded-lg text-sm text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#24A0ED]/50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="p-2 bg-[#24A0ED] text-white rounded-lg hover:bg-[#1d8bd1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { icon: FileText, label: 'Summarize', action: 'Summarize the key points' },
            { icon: BarChart3, label: 'Analyze', action: 'Analyze bias and credibility' },
            { icon: HelpCircle, label: 'Context', action: 'Explain the context' },
            { icon: Lightbulb, label: 'Insights', action: 'Provide insights and implications' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(item.action)}
              className="flex items-center space-x-1 px-2 py-1 bg-light-100 dark:bg-dark-100 border border-light-200 dark:border-dark-200 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
            >
              <item.icon className="w-3 h-3 text-[#24A0ED]" />
              <span className="text-xs text-black dark:text-white">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticleAgent;
