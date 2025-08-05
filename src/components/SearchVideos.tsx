/* eslint-disable @next/next/no-img-element */
import { PlayCircle, PlayIcon, PlusIcon, VideoIcon } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import Lightbox, { GenericSlide, VideoSlide } from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Message } from './ChatWindow';

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

const Searchvideos = ({
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
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<VideoSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  // Auto-search videos when component mounts
  useEffect(() => {
    if (query && !videos && !loading) {
      searchVideos();
    }
  }, [query]);

  const searchVideos = async () => {
    if (loading) return;
    
    setLoading(true);

    const chatModelProvider = localStorage.getItem('chatModelProvider');
    const chatModel = localStorage.getItem('chatModel');

    const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
    const customOpenAIKey = localStorage.getItem('openAIApiKey');

    try {
      const res = await fetch(`/api/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          chatHistory: chatHistory,
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

      const videos = data.videos ?? [];
      setVideos(videos);
      setSlides(
        videos.map((video: Video) => {
          return {
            type: 'video-slide',
            iframe_src: video.iframe_src,
            src: video.img_src,
          };
        }),
      );
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {videos.map((video, i) => (
              <div
                key={i}
                onClick={() => {
                  setOpen(true);
                  setCurrentIndex(i);
                }}
                className="relative h-32 w-full aspect-video rounded-lg transition duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer shadow-sm overflow-hidden group"
              >
                <img
                  src={video.img_src}
                  alt={video.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                  <PlayCircle className="text-white" size={32} />
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-medium truncate drop-shadow-lg">
                    {video.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Lightbox 
            open={open} 
            close={() => setOpen(false)} 
            slides={slides}
            index={currentIndex}
            onIndexChange={setCurrentIndex}
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
            onClick={searchVideos}
            className="mt-4 px-4 py-2 bg-[#24A0ED] text-white rounded-lg hover:bg-[#1e8bd8] transition-colors duration-200"
          >
            Search Videos
          </button>
        </div>
      )}
    </>
  );
};

export default Searchvideos;
