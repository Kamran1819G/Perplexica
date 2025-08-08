/* eslint-disable @next/next/no-img-element */
import { PlayCircle, PlayIcon, PlusIcon, VideoIcon, Loader2, X } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Message } from './ChatWindow';
import Masonry from '@/components/ui/masonry/Masonry';

type Video = {
  url: string;
  img_src: string;
  title: string;
  iframe_src: string;
};

// Custom Video Modal Component
const VideoModal = ({ 
  isOpen, 
  onClose, 
  video 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  video: Video | null; 
}) => {
  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-light-secondary dark:bg-dark-secondary rounded-2xl shadow-xl border border-light-200 dark:border-dark-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-200 dark:border-dark-200">
          <h3 className="text-lg font-semibold text-black dark:text-white truncate pr-4">
            {video.title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-100 dark:hover:bg-dark-100 transition duration-200 hover:text-black dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Video Player */}
        <div className="relative w-full aspect-video">
          <iframe
            src={video.iframe_src}
            className="w-full h-full rounded-b-2xl"
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-light-200 dark:border-dark-200">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-[#24A0ED] hover:text-[#1e8bd8] text-sm font-medium transition-colors duration-200"
          >
            <span>Watch on original site</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

const SearchVideos = ({
  query,
  chatHistory,
  messageId,
}: {
  query: string;
  chatHistory: Message[];
  messageId: string;
}) => {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const videoRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const searchCache = useRef<Map<string, { videos: Video[], timestamp: number, total: number }>>(new Map());

  // Auto-search videos when component mounts
  useEffect(() => {
    if (query && !videos && !loading) {
      searchVideos();
    }
  }, [query]);

  // Immediate search when component becomes visible (tab is clicked)
  useEffect(() => {
    if (query && !videos && !loading) {
      // Show loading immediately when tab is clicked
      setIsInitialLoad(true);
      // Start loading immediately when component is rendered
      searchVideos();
    }
  }, []); // Empty dependency array to run once when component mounts

  // Check cache before searching
  const getCachedResults = useCallback((queryKey: string) => {
    const cached = searchCache.current.get(queryKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return cached;
    }
    return null;
  }, []);

  // Set cache
  const setCachedResults = useCallback((queryKey: string, results: Video[], total: number) => {
    searchCache.current.set(queryKey, {
      videos: results,
      timestamp: Date.now(),
      total: total
    });
  }, []);

  const searchVideos = async (isLoadMore = false) => {
    if (loading || (isLoadMore && loadingMore)) return;
    
    const currentQuery = query.trim();
    if (!currentQuery) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setVideos(null);
      setPage(1);
      setHasMore(true);
    }

    const chatModelProvider = localStorage.getItem('chatModelProvider');
    const chatModel = localStorage.getItem('chatModel');
    const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
    const customOpenAIKey = localStorage.getItem('openAIApiKey');

    try {
      // Check cache for initial search
      if (!isLoadMore) {
        const cachedResults = getCachedResults(currentQuery);
        if (cachedResults) {
          setVideos(cachedResults.videos);
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentQuery,
          chatHistory: chatHistory,
          page: isLoadMore ? page + 1 : 1,
          chatModel: {
            provider: chatModelProvider,
            model: chatModel,
            ...(chatModelProvider === 'custom_openai' && {
              customOpenAIBaseURL: customOpenAIBaseURL,
              customOpenAIKey: customOpenAIKey,
            }),
          },
        }),
      });

      const data = await res.json();
      const newVideos = data.videos ?? [];
      const total = data.total || 0;

      if (isLoadMore) {
        setVideos(prev => [...(prev || []), ...newVideos]);
        setPage(prev => prev + 1);
        setHasMore(newVideos.length >= 25);
        // For load more, we keep the original total or add to it
        setTotalResults(prev => Math.max(prev, total));
      } else {
        setVideos(newVideos);
        setPage(1);
        setHasMore(newVideos.length >= 25);
        setCachedResults(currentQuery, newVideos, total);
        setTotalResults(total);
      }
      
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsInitialLoad(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          searchVideos(true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, page]);

  // Transform videos to Masonry format with optimized heights and virtual scrolling
  const masonryItems = videos?.slice(0, 100).map((video, index) => ({
    id: index.toString(),
    img: video.img_src,
    url: video.url,
    height: 200 + (index % 3) * 50, // More predictable heights for better layout
  })) || [];

  const handleVideoClick = (itemId: string) => {
    const index = parseInt(itemId);
    const video = videos?.[index];
    if (video) {
      setSelectedVideo(video);
      setIsModalOpen(true);
    }
  };

  const handleRetry = () => {
    searchCache.current.delete(query.trim());
    searchVideos();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  return (
    <>
      {(loading || isInitialLoad) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="bg-light-secondary dark:bg-dark-secondary h-32 w-full rounded-lg animate-pulse aspect-video object-cover relative"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoIcon className="text-black/30 dark:text-white/30" size={32} />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && videos && videos.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              Found {totalResults} videos
              {videos && videos.length > 0 && videos.length < totalResults && (
                <span className="ml-2 text-xs text-gray-400">
                  (showing {videos.length})
                </span>
              )}
            </span>
            {totalResults > 100 && (
              <span className="text-xs text-gray-400">
                Showing first 100 results
              </span>
            )}
          </div>
          <div className="w-full">
            <Masonry
              items={masonryItems}
              ease="power3.out"
              duration={0.4}
              stagger={0.03}
              animateFrom="center"
              scaleOnHover={true}
              hoverScale={0.95}
              blurToFocus={true}
              colorShiftOnHover={false}
              onItemClick={handleVideoClick}
            />
          </div>
          
          {/* Infinite scroll loading indicator */}
          {hasMore && (
            <div ref={loadingRef} className="flex justify-center py-4">
              {loadingMore ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-sm text-gray-500">Loading more videos...</span>
                </div>
              ) : (
                <div className="h-4" /> // Invisible element for intersection observer
              )}
            </div>
          )}
          
          {/* Custom Video Modal */}
          <VideoModal 
            isOpen={isModalOpen}
            onClose={closeModal}
            video={selectedVideo}
          />
        </>
      )}
      
      {!loading && (!videos || videos.length === 0) && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <VideoIcon className="text-black/30 dark:text-white/30 mb-2" size={48} />
          <p className="text-black/50 dark:text-white/50 text-sm">
            No videos found for &quot;{query}&quot;
          </p>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-[#24A0ED] text-white rounded-lg hover:bg-[#1e8bd8] transition-colors duration-200"
          >
            Search Videos
          </button>
        </div>
      )}
    </>
  );
};

export default SearchVideos;
