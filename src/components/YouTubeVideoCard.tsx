import React from 'react';
import { Play, Clock, Eye, Calendar, ExternalLink } from 'lucide-react';

interface YouTubeVideoInfo {
  title: string;
  channel: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
  videoId: string;
  url: string;
}

interface YouTubeVideoCardProps {
  videoInfo: YouTubeVideoInfo;
  summary: string;
  hasTranscript: boolean;
}

const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({
  videoInfo,
  summary,
  hasTranscript,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-200 dark:border-dark-200 overflow-hidden">
      {/* Video Header */}
      <div className="relative">
        <img
          src={videoInfo.thumbnail}
          alt={videoInfo.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/640x360/666666/ffffff?text=Video+Thumbnail';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-red-600 text-white p-3 rounded-full">
            <Play className="w-6 h-6" fill="currentColor" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-sm">
          {videoInfo.duration}
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-2 line-clamp-2">
          {videoInfo.title}
        </h3>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3 space-x-4">
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {videoInfo.viewCount}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {videoInfo.duration}
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(videoInfo.publishedAt)}
          </div>
        </div>

        <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          <span className="font-medium">Channel:</span> {videoInfo.channel}
        </div>

        {/* Transcript Status */}
        {hasTranscript && (
          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-2 rounded-md text-sm mb-4 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Transcript available - Summary generated from video content
          </div>
        )}

        {/* Summary */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div 
            className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }}
          />
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t border-light-200 dark:border-dark-200">
          <a
            href={videoInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <Play className="w-4 h-4 mr-2" />
            Watch on YouTube
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default YouTubeVideoCard; 