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
        <h3 className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t('sources.title') || 'Sources'} ({sources.length})
        </h3>
      </div>

      <div className="grid gap-3">
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
                'group border border-light-200 dark:border-dark-200 rounded-lg',
                'bg-light-secondary/50 dark:bg-dark-secondary/50 hover:bg-light-secondary dark:hover:bg-dark-secondary',
                'transition-all duration-200',
                hoveredIndex === index && 'shadow-md border-light-secondary dark:border-dark-secondary'
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="p-4">
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
                            parent.innerHTML = '<div class="w-4 h-4 bg-light-200 dark:bg-dark-200 rounded-sm flex items-center justify-center"><svg class="w-2.5 h-2.5 text-black/60 dark:text-white/60" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd"></path></svg></div>';
                          }
                        }}
                      />
                    ) : (
                      <Icon className="h-4 w-4 text-black/60 dark:text-white/60" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-black/60 dark:text-white/60 font-medium">
                        {domainName}
                      </span>
                      {!isFile && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-light-200/80 dark:bg-dark-200/80 text-black/70 dark:text-white/70 rounded-full">
                          <Globe className="h-2.5 w-2.5" />
                          Web
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-black dark:text-white mb-2 leading-tight">
                      {formatTitle(title)}
                    </h4>
                    <p className="text-xs text-black/70 dark:text-white/70 line-clamp-2 leading-relaxed">
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
                        'bg-light-200 dark:bg-dark-200 hover:bg-light-secondary dark:hover:bg-dark-secondary',
                        'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white',
                        'transition-colors duration-200 flex-shrink-0',
                        'focus:outline-none focus:ring-2 focus:ring-[#24A0ED] focus:ring-offset-1'
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
