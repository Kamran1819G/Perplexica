'use client';

import React, { useState, useMemo } from 'react';
import { ImageResult } from './ChatWindow';
import Masonry from './ui/masonry/Masonry';
import { ExternalLink, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageImagesProps {
  images: ImageResult[];
  query: string;
  loading?: boolean;
  className?: string;
}

const MessageImages: React.FC<MessageImagesProps> = ({
  images,
  query,
  loading = false,
  className
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Transform images to Masonry format with optimized heights
  const masonryItems = useMemo(() => 
    images.slice(0, 100).map((image, index) => ({
      id: index.toString(),
      img: image.img_src,
      url: image.url,
      title: image.title,
      height: 200 + (index % 3) * 50, // Predictable heights for better layout
    })), [images]
  );

  const handleImageClick = (itemId: string) => {
    const index = parseInt(itemId);
    const image = images[index];
    if (image) {
      setSelectedImage(image);
      setIsModalOpen(true);
    }
  };

  const handleImageLoad = (imageSrc: string) => {
    setLoadedImages(prev => new Set([...prev, imageSrc]));
  };

  const handleImageError = (imageSrc: string) => {
    setFailedImages(prev => new Set([...prev, imageSrc]));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="bg-light-secondary dark:bg-dark-secondary h-32 w-full rounded-lg animate-pulse aspect-video"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className={cn("w-full flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="w-16 h-16 rounded-full bg-light-secondary dark:bg-dark-secondary flex items-center justify-center mb-4">
          <RotateCcw size={24} className="text-black/50 dark:text-white/50" />
        </div>
        <h3 className="text-lg font-medium text-black dark:text-white mb-2">No Images Found</h3>
        <p className="text-sm text-black/70 dark:text-white/70 max-w-md">
          No relevant images were found for &quot;{query}&quot;. Try refining your search query or check your internet connection.
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
            Found {images.length} images
          </span>
          {images.length > 100 && (
            <span className="text-xs text-gray-400 bg-light-secondary dark:bg-dark-secondary px-2 py-1 rounded">
              Showing first 100
            </span>
          )}
        </div>
      </div>

      {/* Masonry layout */}
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

      {/* Modal for image preview */}
      {isModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] mx-4">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={selectedImage.img_src}
              alt={selectedImage.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <h3 className="text-white font-medium mb-2 line-clamp-2">
                {selectedImage.title}
              </h3>
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-white/80 hover:text-white text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={16} />
                <span>View source</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageImages;
