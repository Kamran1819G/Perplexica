'use client';

import React, { useState, useMemo } from 'react';
import { VideoResult } from './ChatWindow';
import { ExternalLink, Play, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageVideosProps {
  videos: VideoResult[];
  query: string;
  loading?: boolean;
  className?: string;
}

const VideoModal: React.FC<{
  video: VideoResult;
  isOpen: boolean;
  onClose: () => void;
}> = ({ video, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl mx-4 bg-black rounded-lg overflow-hidden shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
        >
          <X size={20} />
        </button>

        {/* Video iframe */}
        <div className="aspect-video">
          <iframe
            src={video.iframe_src}
            title={video.title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Video info */}
        <div className="p-4 bg-gray-900">
          <h3 className="text-white font-medium mb-2 line-clamp-2">
            {video.title}
          </h3>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-white/80 hover:text-white text-sm"
          >
            <ExternalLink size={16} />
            <span>View on platform</span>
          </a>
        </div>
      </div>
    </div>
  );
};

const MessageVideos: React.FC<MessageVideosProps> = ({
  videos,
  query,
  loading = false,
  className
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set());
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());

  const handleVideoClick = (video: VideoResult) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleThumbnailLoad = (thumbnailSrc: string) => {
    setLoadedThumbnails(prev => new Set([...prev, thumbnailSrc]));
  };

  const handleThumbnailError = (thumbnailSrc: string) => {
    setFailedThumbnails(prev => new Set([...prev, thumbnailSrc]));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="bg-light-secondary dark:bg-dark-secondary aspect-video rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-light-secondary dark:bg-dark-secondary rounded animate-pulse" />
                <div className="h-3 bg-light-secondary dark:bg-dark-secondary rounded w-3/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className={cn("w-full flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="w-16 h-16 rounded-full bg-light-secondary dark:bg-dark-secondary flex items-center justify-center mb-4">
          <RotateCcw size={24} className="text-black/50 dark:text-white/50" />
        </div>
        <h3 className="text-lg font-medium text-black dark:text-white mb-2">No Videos Found</h3>
        <p className="text-sm text-black/70 dark:text-white/70 max-w-md">
          No relevant videos were found for &quot;{query}&quot;. Try refining your search query or check your internet connection.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Found {videos.length} videos
          </span>
          {videos.length > 25 && (
            <span className="text-xs text-gray-400 bg-light-secondary dark:bg-dark-secondary px-2 py-1 rounded">
              Showing first 25
            </span>
          )}
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video, index) => (
          <div
            key={index}
            className="group cursor-pointer space-y-3"
            onClick={() => handleVideoClick(video)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-light-secondary dark:bg-dark-secondary rounded-lg overflow-hidden">
              {!failedThumbnails.has(video.img_src) ? (
                <>
                  <img
                    src={video.img_src}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onLoad={() => handleThumbnailLoad(video.img_src)}
                    onError={() => handleThumbnailError(video.img_src)}
                  />
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Play size={20} className="text-black ml-1" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-light-secondary dark:bg-dark-secondary">
                  <div className="text-center">
                    <Play size={24} className="mx-auto mb-2 text-black/50 dark:text-white/50" />
                    <span className="text-xs text-black/50 dark:text-white/50">Video</span>
                  </div>
                </div>
              )}
            </div>

            {/* Video info */}
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-black dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {video.title}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/60 dark:text-white/60">
                  {video.url ? new URL(video.url).hostname.replace('www.', '') : 'Video'}
                </span>
                <ExternalLink size={12} className="text-black/40 dark:text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video modal */}
      <VideoModal
        video={selectedVideo!}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default MessageVideos;
