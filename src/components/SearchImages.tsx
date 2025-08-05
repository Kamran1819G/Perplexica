/* eslint-disable @next/next/no-img-element */
import { ImagesIcon, PlusIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Message } from './ChatWindow';

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
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);

  // Auto-search images when component mounts
  useEffect(() => {
    if (query && !images && !loading) {
      searchImages();
    }
  }, [query]);

  const searchImages = async () => {
    if (loading) return;
    
    setLoading(true);

    const chatModelProvider = localStorage.getItem('chatModelProvider');
    const chatModel = localStorage.getItem('chatModel');

    const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
    const customOpenAIKey = localStorage.getItem('openAIApiKey');

    try {
      const res = await fetch(`/api/images`, {
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

      const images = data.images ?? [];
      setImages(images);
      setSlides(
        images.map((image: Image) => {
          return {
            src: image.img_src,
          };
        }),
      );
    } catch (error) {
      console.error('Error searching images:', error);
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
              className="bg-light-secondary dark:bg-dark-secondary h-32 w-full rounded-lg animate-pulse aspect-video object-cover"
            />
          ))}
        </div>
      )}
      
      {!loading && images && images.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, i) => (
              <img
                onClick={() => {
                  setOpen(true);
                  setSlides([
                    slides[i],
                    ...slides.slice(0, i),
                    ...slides.slice(i + 1),
                  ]);
                }}
                key={i}
                src={image.img_src}
                alt={image.title}
                className="h-32 w-full aspect-video object-cover rounded-lg transition duration-200 active:scale-95 hover:scale-[1.02] cursor-zoom-in shadow-sm"
              />
            ))}
          </div>
          <Lightbox open={open} close={() => setOpen(false)} slides={slides} />
        </>
      )}
      
      {!loading && (!images || images.length === 0) && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ImagesIcon className="text-black/30 dark:text-white/30 mb-2" size={48} />
          <p className="text-black/50 dark:text-white/50 text-sm">
            No images found for "{query}"
          </p>
          <button
            onClick={searchImages}
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
