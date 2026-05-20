import React, { useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Download, Trash2, Upload, Loader2 } from 'lucide-react';
import { useLongPress } from '../hooks/useLongPress';

export function ImageNode({ data, isConnectable, id }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const longPressHandlers = useLongPress(() => {
    if (data.onLongPress) {
      data.onLongPress(id, 'imageNode');
    }
  });

  const processFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) {
        setIsUploading(false);
        return;
      }

      let finalUrl = base64;
      try {
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: base64,
            filename: file.name || `uploaded-${Date.now()}.png`
          })
        });
        const upData = await upRes.json();
        if (upData.url) {
          finalUrl = upData.url;
        }
      } catch (err) {
        console.error("Local file upload to server failed, falling back to base64", err);
      }

      if (data.onChange) {
        data.onChange(id, { url: finalUrl, label: file.name });
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleBoxClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div 
      {...longPressHandlers}
      className={`bg-[#2a2a2a] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border-2 w-64 group transition-colors cursor-pointer select-none active:brightness-95 ${isDragOver ? 'border-[#FFCC00]' : 'border-[#555]'}`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-[#FFCC00] hover:!scale-150 !border-2 !border-zinc-800 transition-all cursor-pointer shadow-md" 
      />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleBoxClick}
        className={`relative w-full aspect-square rounded-t-xl overflow-hidden bg-zinc-800 flex flex-col items-center justify-center cursor-pointer select-none transition-all ${isDragOver ? 'bg-zinc-700/50 scale-[0.98]' : ''}`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-[#FFCC00]" />
            <span className="text-gray-400 font-bold text-xs">Uploading...</span>
          </div>
        ) : data.url ? (
          <div className="relative w-full h-full">
            <img src={data.url} alt="Node content" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
              <span className="text-white text-xs font-bold px-3 py-1.5 bg-black/40 rounded-lg backdrop-blur-sm border border-white/10">Click to replace</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="p-3 bg-zinc-700/50 rounded-full text-zinc-400 group-hover:text-white group-hover:bg-zinc-600/50 transition-colors">
              <Upload size={24} />
            </div>
            <span className="text-gray-400 font-bold text-sm tracking-tight group-hover:text-gray-200 transition-colors">Upload Image</span>
            <span className="text-gray-500 text-[10px] max-w-[150px] leading-relaxed">Drag and drop or click to choose a target image</span>
          </div>
        )}

        {/* Hover overlay actions (when image is present) */}
        {!isUploading && data.url && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation(); // don't open upload dialog
                const a = document.createElement('a');
                a.href = data.url;
                a.download = `image-${Date.now()}.png`;
                a.click();
              }}
              className="p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-md backdrop-blur-sm transition-colors border border-white/10"
              title="Download image"
            >
               <Download size={14} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation(); // don't open upload dialog
                if (data.onChange) {
                  data.onChange(id, { url: '', label: '' });
                }
              }}
              className="p-1.5 bg-red-950/60 hover:bg-red-600 text-white rounded-md backdrop-blur-sm transition-colors border border-red-900/30"
              title="Remove image"
            >
               <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      
      {data.label && (
         <div className="p-2 text-xs font-bold text-center text-gray-300 truncate border-t border-[#444] bg-zinc-800/40 rounded-b-xl">
            {data.label}
         </div>
      )}

      <Handle 
        type="source" 
        position={Position.Right} 
        id="a" 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-[#FFCC00] hover:!scale-150 !border-2 !border-zinc-800 transition-all cursor-pointer shadow-md" 
      />
    </div>
  );
}
