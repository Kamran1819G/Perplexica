import React from 'react';
import { Bookmark, BookmarkCheck, X, Share2 } from 'lucide-react';

interface DiscoverArticleModalProps {
    article: {
        title: string;
        content: string;
        url: string;
        thumbnail: string;
        author?: string;
        source?: string;
    };
    open: boolean;
    onClose: () => void;
    onFavorite: () => void;
    isFavorite: boolean;
}

const DiscoverArticleModal: React.FC<DiscoverArticleModalProps> = ({ article, open, onClose, onFavorite, isFavorite }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-dark-secondary rounded-2xl shadow-2xl max-w-2xl w-full relative overflow-hidden">
                <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10" onClick={onClose} aria-label="Close"><X size={28} /></button>
                <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-64 object-cover object-center"
                    onError={e => (e.currentTarget.src = '/default-article.png')}
                />
                <div className="p-6 flex flex-col gap-3">
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
                    <div className="text-2xl font-bold text-white mb-1">
                        {article.title}
                    </div>
                    <div className="text-white/80 text-base mb-2">
                        {article.content}
                    </div>
                    <div className="flex flex-row gap-4 mt-2">
                        <button
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#24A0ED] text-white font-medium hover:bg-[#1a7fc2] transition"
                            onClick={() => window.open(article.url, '_blank')}
                        >
                            Read Full Article
                        </button>
                        <button
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-dark-200 text-white/80 hover:bg-dark-100 transition"
                            onClick={() => navigator.clipboard.writeText(article.url)}
                        >
                            <Share2 size={18} /> Share
                        </button>
                        <button
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition"
                            onClick={onFavorite}
                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {isFavorite ? <BookmarkCheck className="text-[#24A0ED]" size={18} /> : <Bookmark className="text-white" size={18} />}
                            {isFavorite ? 'Saved' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscoverArticleModal; 