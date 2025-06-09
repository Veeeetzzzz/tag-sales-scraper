import React, { useState, useRef, useEffect } from 'react';
import { getOptimizedImageUrl, getPlaceholderImageUrl } from '../utils/imageUtils';

/**
 * Check if we're in a serverless environment
 */
function isServerlessEnvironment() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname.includes('vercel.app') || hostname.includes('netlify.app') || hostname.includes('amazonaws.com');
  }
  return false;
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width = 250, 
  height = 350, 
  lazy = true,
  placeholder = null,
  fallback = null,
  onLoad = null,
  onError = null
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: '50px' // Start loading 50px before the image comes into view
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = (event) => {
    console.warn(`Failed to load image: ${event.target.src}`);
    setIsError(true);
    onError?.(event);
  };

  const getImageSrc = () => {
    if (isError) {
      return fallback || getPlaceholderImageUrl(width, height, 'Image Error');
    }
    if (!isInView) {
      return placeholder || getPlaceholderImageUrl(width, height, 'Loading...');
    }
    
    // In serverless environments, we might want to be more conservative with image optimization
    if (isServerlessEnvironment()) {
      return src || getPlaceholderImageUrl(width, height, 'No Image');
    }
    
    return getOptimizedImageUrl(src) || getPlaceholderImageUrl(width, height, 'No Image');
  };

  const getDisplaySrc = () => {
    const imageSrc = getImageSrc();
    return imageSrc;
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: height }}
    >
      <img
        src={getDisplaySrc()}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded && !isError ? 'opacity-100' : 'opacity-70'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? 'lazy' : 'eager'}
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          // Add explicit dimensions to help with loading
          width: width ? `${width}px` : 'auto'
        }}
      />
      
      {/* Loading indicator */}
      {!isLoaded && !isError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm8 3l3 4H7l2-2.5L11 13l3-4z"/>
            </svg>
            <p className="text-sm">Image failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 