import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface DiscoverHeroCardProps {
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

const DiscoverHeroCard: React.FC<DiscoverHeroCardProps> = ({ article, onFavorite, isFavorite, onClick }) => {
    return (
        <div className="relative w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-lg bg-dark-secondary cursor-pointer group" onClick={onClick}>
            <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-64 object-cover object-center group-hover:opacity-90 transition"
                onError={e => (e.currentTarget.src = '/default-article.png')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 w-full flex flex-col gap-2">
                <div className="flex flex-row items-center gap-2 mb-2">
                    {article.source && (
                        <span className="text-xs bg-light-200/80 dark:bg-dark-200/80 text-black/70 dark:text-white/70 rounded px-2 py-1 font-medium">
                            {article.source}
                        </span>
                    )}
                    {article.author && (
                        <span className="text-xs text-white/60">by {article.author}</span>
                    )}
                </div>
                <div className="text-2xl font-bold text-white mb-1 line-clamp-2 drop-shadow-lg">
                    {article.title}
                </div>
                <div className="text-white/80 text-base line-clamp-3 drop-shadow">
                    {article.content}
                </div>
            </div>
            <button
                className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 rounded-full p-2 transition"
                onClick={e => { e.stopPropagation(); onFavorite(); }}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                {isFavorite ? <BookmarkCheck className="text-[#24A0ED]" size={24} /> : <Bookmark className="text-white" size={24} />}
            </button>
        </div>
    );
};

export default DiscoverHeroCard; 