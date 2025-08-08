/* eslint-disable @next/next/no-img-element */
import { ImagesIcon, PlusIcon, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Message } from './ChatWindow';
import Masonry from '@/blocks/Components/Masonry/Masonry';

type Image = {
  url: string;
  img_src: string;
  title: string;
};

const SearchImages = ({
  query,
  chatHistory,
  messageId,
}: {
  query: string;
  chatHistory: Message[];
  messageId: string;
}) => {
  const [images, setImages] = useState<Image[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const searchCache = useRef<Map<string, { images: Image[], timestamp: number, total: number }>>(new Map());

  // Auto-search images when component mounts or query changes
  useEffect(() => {
    if (query && !images && !loading) {
      searchImages();
    }
  }, [query]);

  // Prevent multiple searches on component mount
  const hasSearched = useRef(false);
  
  useEffect(() => {
    if (query && !hasSearched.current && !images && !loading) {
      hasSearched.current = true;
      setIsInitialLoad(true);
      searchImages();
    }
  }, [query, images, loading]);

  // Check cache before searching
  const getCachedResults = useCallback((queryKey: string) => {
    const cached = searchCache.current.get(queryKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return cached;
    }
    return null;
  }, []);

  // Set cache
  const setCachedResults = useCallback((queryKey: string, results: Image[], total: number) => {
    searchCache.current.set(queryKey, {
      images: results,
      timestamp: Date.now(),
      total: total
    });
  }, []);

  const searchImages = async (isLoadMore = false) => {
    if (loading || (isLoadMore && loadingMore)) return;
    
    const currentQuery = query.trim();
    if (!currentQuery) return;

    // Prevent duplicate searches for the same query
    if (!isLoadMore && images && images.length > 0) {
      return;
    }

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setImages(null);
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
          setImages(cachedResults.images);
          setSlides(cachedResults.images.map((image: Image) => ({ src: image.img_src })));
          setTotalResults(cachedResults.total);
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/images`, {
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
      const newImages = data.images ?? [];
      const total = data.total || 0;

      if (isLoadMore) {
        setImages(prev => [...(prev || []), ...newImages]);
        setPage(prev => prev + 1);
        setHasMore(newImages.length >= 25);
        // For load more, we keep the original total or add to it
        setTotalResults(prev => Math.max(prev, total));
      } else {
        setImages(newImages);
        setPage(1);
        setHasMore(newImages.length >= 25);
        setCachedResults(currentQuery, newImages, total);
        setTotalResults(total);
      }

      // Update slides for lightbox
      const allImages = isLoadMore ? [...(images || []), ...newImages] : newImages;
      setSlides(allImages.map((image: Image) => ({ src: image.img_src })));
      
    } catch (error) {
      console.error('Error searching images:', error);
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
          searchImages(true);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Transform images to Masonry format with optimized heights and virtual scrolling
  const masonryItems = images?.slice(0, 100).map((image, index) => ({
    id: index.toString(),
    img: image.img_src,
    url: image.url,
    height: 200 + (index % 3) * 50, // More predictable heights for better layout
  })) || [];

  const handleImageClick = (itemId: string) => {
    const index = parseInt(itemId);
    setOpen(true);
    setSlides([
      slides[index],
      ...slides.slice(0, index),
      ...slides.slice(index + 1),
    ]);
  };

  const handleRetry = () => {
    searchCache.current.delete(query.trim());
    searchImages();
  };

  return (
    <>
      {(loading || isInitialLoad) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="bg-light-secondary dark:bg-dark-secondary h-32 w-full rounded-lg animate-pulse aspect-video object-cover"
            />
          ))}
        </div>
      )}
      
      {!loading && images && images.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              Found {totalResults} images
              {images && images.length > 0 && images.length < totalResults && (
                <span className="ml-2 text-xs text-gray-400">
                  (showing {images.length})
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
              onItemClick={handleImageClick}
            />
          </div>
          
          {/* Infinite scroll loading indicator */}
          {hasMore && (
            <div ref={loadingRef} className="flex justify-center py-4">
              {loadingMore ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-sm text-gray-500">Loading more images...</span>
                </div>
              ) : (
                <div className="h-4" /> // Invisible element for intersection observer
              )}
            </div>
          )}
          
          <Lightbox open={open} close={() => setOpen(false)} slides={slides} />
        </>
      )}
      
      {!loading && (!images || images.length === 0) && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ImagesIcon className="text-black/30 dark:text-white/30 mb-2" size={48} />
          <p className="text-black/50 dark:text-white/50 text-sm">
            No images found for &quot;{query}&quot;
          </p>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-[#24A0ED] text-white rounded-lg hover:bg-[#1e8bd8] transition-colors duration-200"
          >
            Search Images
          </button>
        </div>
      )}
    </>
  );
};

export default SearchImages;
