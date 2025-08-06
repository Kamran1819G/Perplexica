/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { Document } from '@langchain/core/documents';
import { File, Globe, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const MessageSources = ({ sources }: { sources: Document[] }) => {
  const { t } = useTranslation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://s2.googleusercontent.com/s2/favicons?domain_url=${urlObj.hostname}&sz=16`;
    } catch {
      return null;
    }
  };

  const getDomainName = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/.+\/\/|www.|\..+/g, '');
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getSourceIcon = (url: string) => {
    if (url === 'File') return FileText;
    return Globe;
  };

  const formatTitle = (title: string) => {
    return title.length > 60 ? `${title.substring(0, 60)}...` : title;
  };

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t('sources.title') || 'Sources'} ({sources.length})
        </h3>
      </div>

      <div className="grid gap-2">
        {sources.map((source, index) => {
          const faviconUrl = getFaviconUrl(source.metadata.url);
          const domainName = getDomainName(source.metadata.url);
          const title = source.metadata.title || 'Untitled';
          const description = source.metadata.description || source.pageContent?.substring(0, 120) || 'No description available';
          const isFile = source.metadata.url === 'File';
          const Icon = getSourceIcon(source.metadata.url);
          
          return (
            <div
              key={index}
              className={cn(
                'group border border-gray-200 dark:border-gray-700 rounded-lg',
                'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                'transition-all duration-200',
                hoveredIndex === index && 'shadow-md border-gray-300 dark:border-gray-600'
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="p-3">
                <div className="flex items-start gap-3">
                  {/* Favicon */}
                  <div className="flex-shrink-0 w-4 h-4 mt-0.5">
                    {!isFile && faviconUrl ? (
                      <img
                        src={faviconUrl}
                        alt=""
                        className="w-4 h-4 rounded-sm"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-4 h-4 bg-gray-400 dark:bg-gray-600 rounded-sm flex items-center justify-center"><svg class="w-2.5 h-2.5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd"></path></svg></div>';
                          }
                        }}
                      />
                    ) : (
                      <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {domainName}
                      </span>
                      {!isFile && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          <Globe className="h-2.5 w-2.5" />
                          Web
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                      {formatTitle(title)}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {truncateText(description, 120)}
                    </p>
                  </div>
                  
                  {!isFile && (
                    <a
                      href={source.metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full',
                        'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                        'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200',
                        'transition-colors duration-200 flex-shrink-0',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageSources;
