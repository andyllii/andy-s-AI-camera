import React, { useRef, useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function DrawingCanvas({ canvasRef }: Props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');

  const colors = ['#000000', '#FF3366', '#33CC66', '#3366FF', '#FFCC00', '#FFFFFF'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    // Adjust for any CSS scaling
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
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineWidth = color === '#FFFFFF' ? 20 : 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
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
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="relative w-full h-[250px] border-4 border-black rounded-xl overflow-hidden bg-white shadow-[8px_8px_0_0_#000]">
        <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full touch-none cursor-crosshair object-cover"
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
            title="Clear Canvas"
        >
            <RefreshCcw size={16} />
        </button>
        </div>
        
        {/* Color Palette */}
        <div className="flex items-center gap-3">
            {colors.map((c) => (
                <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-black scale-110 shadow-[2px_2px_0_0_#000]' : 'border-gray-300'} ${c === '#FFFFFF' ? 'border-dashed border-gray-400' : ''} transition-all`}
                    title={c === '#FFFFFF' ? 'Eraser' : c}
                />
            ))}
        </div>
    </div>
  );
}
