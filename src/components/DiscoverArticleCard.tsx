import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface DiscoverArticleCardProps {
    article: {
        title: string;
        content: string;
        url: string;
        thumbnail: string;
        author?: string;
        source?: string;
    };
    onFavorite: () => void;
    isFavorite: boolean;
    onClick: () => void;
}

const DiscoverArticleCard: React.FC<DiscoverArticleCardProps> = ({ article, onFavorite, isFavorite, onClick }) => {
    return (
        <div
            className="relative w-full rounded-xl overflow-hidden bg-dark-secondary border border-dark-200 shadow-md flex flex-col cursor-pointer group hover:-translate-y-1 hover:shadow-lg transition"
            onClick={onClick}
        >
            <img
                src={article.thumbnail}
                alt={article.title}
                className="object-cover w-full h-32 sm:h-40 bg-light-200 dark:bg-dark-200 group-hover:opacity-90 transition"
                onError={e => (e.currentTarget.src = '/default-article.png')}
            />
            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                <div className="font-bold text-sm sm:text-lg mb-1 truncate text-white" title={article.title}>
                    {article.title}
                </div>
                <p className="text-white/70 text-xs sm:text-sm mb-2 line-clamp-2">
                    {article.content}
                </p>
                <div className="flex flex-row items-center gap-2 mt-auto">
                    {article.source && (
                        <span className="text-xs bg-light-200/80 dark:bg-dark-200/80 text-black/70 dark:text-white/70 rounded px-2 py-1 font-medium">
                            {article.source}
                        </span>
                    )}
                    {article.author && (
                        <span className="text-xs text-white/60">by {article.author}</span>
                    )}
                </div>
            </div>
            <button
                className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 bg-black/60 hover:bg-black/80 rounded-full p-1.5 sm:p-2 transition"
                onClick={e => { e.stopPropagation(); onFavorite(); }}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                {isFavorite ? 
                    <BookmarkCheck className="text-[#24A0ED] w-4 h-4 sm:w-5 sm:h-5" /> : 
                    <Bookmark className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                }
            </button>
        </div>
    );
};

export default DiscoverArticleCard; 