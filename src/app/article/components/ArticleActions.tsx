'use client';

import React, { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Bookmark, 
  Share2, 
  MessageCircle,
  Flag,
  Copy,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react';
import { NewsArticle } from '@/lib/news/types';

interface ArticleActionsProps {
  article: NewsArticle;
  onInteraction: (action: 'like' | 'dislike' | 'save' | 'share') => void;
}

const ArticleActions: React.FC<ArticleActionsProps> = ({ article, onInteraction }) => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleLike = () => {
    if (disliked) setDisliked(false);
    setLiked(!liked);
    onInteraction('like');
  };

  const handleDislike = () => {
    if (liked) setLiked(false);
    setDisliked(!disliked);
    onInteraction('dislike');
  };

  const handleSave = () => {
    setSaved(!saved);
    onInteraction('save');
  };

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    const title = article.title;
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setShowShareMenu(false);
    }
    
    onInteraction('share');
  };

  return (
    <div className="flex items-center justify-between">
      {/* Main Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            liked
              ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
              : 'bg-light-100 dark:bg-dark-100 text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm">Helpful</span>
        </button>

        <button
          onClick={handleDislike}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            disliked
              ? 'bg-red-100 dark:bg-red-900/20 text-red-600'
              : 'bg-light-100 dark:bg-dark-100 text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm">Not Helpful</span>
        </button>

        <button
          onClick={handleSave}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            saved
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
              : 'bg-light-100 dark:bg-dark-100 text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span className="text-sm">{saved ? 'Saved' : 'Save'}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-light-100 dark:bg-dark-100 text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>

          {/* Share Menu */}
          {showShareMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg shadow-lg py-2 z-10 min-w-48">
              <button
                onClick={() => handleShare('copy')}
                className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-light-100 dark:hover:bg-dark-100 text-black dark:text-white"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-light-100 dark:hover:bg-dark-100 text-black dark:text-white"
              >
                <Twitter className="w-4 h-4 text-blue-500" />
                <span>Share on Twitter</span>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-light-100 dark:hover:bg-dark-100 text-black dark:text-white"
              >
                <Facebook className="w-4 h-4 text-blue-600" />
                <span>Share on Facebook</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-light-100 dark:hover:bg-dark-100 text-black dark:text-white"
              >
                <Linkedin className="w-4 h-4 text-blue-700" />
                <span>Share on LinkedIn</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center space-x-3">
        <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-light-100 dark:bg-dark-100 text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">Discuss</span>
        </button>

        <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-light-100 dark:bg-dark-100 text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors">
          <Flag className="w-4 h-4" />
          <span className="text-sm">Report</span>
        </button>
      </div>
    </div>
  );
};

export default ArticleActions;
