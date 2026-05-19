import React, { useRef, useState, useEffect } from 'react';
import { RefreshCcw, Eraser } from 'lucide-react';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  backgroundImage: string;
}

export function MaskCanvas({ canvasRef, backgroundImage }: Props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create an image element to draw it to the canvas for sizing if needed...
    // But actually, we just want the canvas over the image.
    // The canvas should be transparent initially.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    if (!coords || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      if (erasing) {
         ctx.globalCompositeOperation = 'destination-out';
      } else {
         ctx.globalCompositeOperation = 'source-over';
         ctx.strokeStyle = 'rgba(255, 204, 0, 0.7)'; // Yellow highlighter
      }
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="relative w-full aspect-square border-4 border-black rounded-xl overflow-hidden shadow-[4px_4px_0_0_#000]">
          {/* Background Image */}
          <img src={backgroundImage} className="absolute inset-0 w-full h-full object-contain pointer-events-none" alt="Base for mask" />
          
          <canvas
              ref={canvasRef}
              width={800}
              height={800} // square context roughly matches 1:1 image
              className="absolute inset-0 w-full h-full touch-none cursor-crosshair object-contain"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
          />
          <button 
              onClick={clearCanvas}
              className="absolute top-2 right-2 p-2 bg-white border-2 border-black rounded-lg hover:bg-gray-100 text-black transition-colors shadow-[2px_2px_0_0_#000]"
              title="Clear Mask"
          >
              <RefreshCcw size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 bg-black/5 p-2 rounded-xl">
           <span className="text-xs font-black uppercase tracking-widest text-current">Brush</span>
           <input 
              type="range" 
              min="5" 
              max="50" 
              value={brushSize} 
              onChange={e => setBrushSize(parseInt(e.target.value))} 
              className="flex-1 accent-[#FFCC00]"
           />
           <button 
              onClick={() => setErasing(!erasing)}
              className={`p-2 border-2 rounded-lg transition-colors ${erasing ? 'bg-[#FFCC00] border-black text-black' : 'bg-white border-gray-400 text-gray-400'}`}
              title="Eraser"
           >
             <Eraser size={16} />
           </button>
        </div>
    </div>
  );
}
