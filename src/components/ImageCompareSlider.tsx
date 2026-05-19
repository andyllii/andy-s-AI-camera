import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface Props {
  originalImage: string;
  editedImage: string;
  className?: string;
}

export function ImageCompareSlider({ originalImage, editedImage, className = "" }: Props) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
      window.addEventListener('touchend', () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', () => setIsDragging(false));
      window.removeEventListener('touchend', () => setIsDragging(false));
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden ${className}`}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* Background (Edited image) */}
      <img 
        src={editedImage} 
        alt="Edited" 
        className="absolute inset-0 w-full h-full object-contain bg-white/50" draggable={false} 
      />

      {/* Foreground (Original image clipped) */}
      <img 
        src={originalImage} 
        alt="Original" 
        className="absolute inset-0 w-full h-full object-contain bg-white/50" 
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        draggable={false} 
      />

      {/* Slider handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 cursor-ew-resize bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] z-10 hover:bg-[#FFCC00] transition-colors flex items-center justify-center pointer-events-none"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0_0_#000] z-20 pointer-events-auto hover:scale-110 transition-transform">
          <ArrowLeftRight className="w-4 h-4 text-black" />
        </div>
      </div>
    </div>
  );
}
