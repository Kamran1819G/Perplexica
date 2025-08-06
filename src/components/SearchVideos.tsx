/* eslint-disable @next/next/no-img-element */
import { PlayCircle, PlayIcon, PlusIcon, VideoIcon, Loader2 } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import Lightbox, { GenericSlide, VideoSlide } from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Message } from './ChatWindow';
import Masonry from './ui/Masonry/Masonry';

type Video = {
  url: string;
  img_src: string;
  title: string;
  iframe_src: string;
};

declare module 'yet-another-react-lightbox' {
  export interface VideoSlide extends GenericSlide {
    type: 'video-slide';
    src: string;
    iframe_src: string;
  }

  interface SlideTypes {
    'video-slide': VideoSlide;
  }
}

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
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<VideoSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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
          setSlides(cachedResults.videos.map((video: Video) => ({
            type: 'video-slide',
            iframe_src: video.iframe_src,
            src: video.img_src,
          })));
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

      // Update slides for lightbox
      const allVideos = isLoadMore ? [...(videos || []), ...newVideos] : newVideos;
      setSlides(allVideos.map((video: Video) => ({
        type: 'video-slide',
        iframe_src: video.iframe_src,
        src: video.img_src,
      })));
      
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
    setOpen(true);
    setCurrentIndex(index);
  };

  const handleRetry = () => {
    searchCache.current.delete(query.trim());
    searchVideos();
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
          
          <Lightbox 
            open={open} 
            close={() => setOpen(false)} 
            slides={slides}
            index={currentIndex}
          />
        </>
      )}
      
      {!loading && (!videos || videos.length === 0) && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <VideoIcon className="text-black/30 dark:text-white/30 mb-2" size={48} />
          <p className="text-black/50 dark:text-white/50 text-sm">
            No videos found for "{query}"
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
