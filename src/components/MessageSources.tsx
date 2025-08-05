/* eslint-disable @next/next/no-img-element */
import { Document } from '@langchain/core/documents';
import { File, Globe, ExternalLink } from 'lucide-react';

const MessageSources = ({ sources }: { sources: Document[] }) => {
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://s2.googleusercontent.com/s2/favicons?domain_url=${urlObj.hostname}&sz=32`;
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

  return (
    <div className="flex flex-col space-y-4">
             {sources.map((source, i) => {
         const faviconUrl = getFaviconUrl(source.metadata.url);
         const domainName = getDomainName(source.metadata.url);
         const title = source.metadata.title || 'Untitled';
         const description = source.metadata.description || source.pageContent?.substring(0, 150) || 'No description available';
         const hasThumbnail = source.metadata.thumbnail || source.metadata.image;

                 return (
           <a
             key={i}
             href={source.metadata.url}
             target="_blank"
             rel="noopener noreferrer"
             className="flex flex-row space-x-4 p-4 bg-light-100 dark:bg-dark-100 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors duration-200 cursor-pointer"
           >
            {/* Left side - Icon and URL */}
            <div className="flex flex-col space-y-2 min-w-0 flex-1">
                             <div className="flex flex-row items-center space-x-3">
                 {/* Favicon */}
                 <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-light-200 dark:bg-dark-200 flex items-center justify-center overflow-hidden">
                   {faviconUrl ? (
                     <img
                       src={faviconUrl}
                       alt={`${domainName} favicon`}
                       className="w-6 h-6 object-contain"
                       onError={(e) => {
                         e.currentTarget.style.display = 'none';
                         e.currentTarget.nextElementSibling?.classList.remove('hidden');
                       }}
                     />
                   ) : null}
                   <Globe size={16} className={`text-black/60 dark:text-white/60 ${faviconUrl ? 'hidden' : ''}`} />
                 </div>
                
                {/* Domain URL */}
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-xs text-black/60 dark:text-white/60 truncate">
                    {domainName}
                  </p>
                  <p className="text-sm font-medium text-black dark:text-white truncate">
                    {title}
                  </p>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed">
                {truncateText(description, 200)}
              </p>
            </div>

            {/* Right side - Thumbnail (if available) */}
            {hasThumbnail && (
              <div className="flex-shrink-0">
                <img
                  src={hasThumbnail}
                  alt={title}
                  className="w-20 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

                         {/* External link indicator */}
             <div className="flex-shrink-0 flex items-start pt-1">
               <ExternalLink size={16} className="text-black/40 dark:text-white/40" />
             </div>
           </a>
         );
      })}
    </div>
  );
};

export default MessageSources;
