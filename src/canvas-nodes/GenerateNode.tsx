import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Sparkles, Loader2 } from 'lucide-react';
import { useLongPress } from '../hooks/useLongPress';

export function GenerateNode({ data, isConnectable, id }: any) {
  const [isGenerating, setIsGenerating] = useState(false);
  const presets = ['1024x1024', '1024x576', '576x1024', '1024x768', '768x1024', '1024x438'];
  const currentRatioVal = data.aspectRatio || '1024x1024';
  const isCustom = !presets.includes(currentRatioVal);

  const { ref } = useLongPress(() => {
    if (data.onLongPress) {
      data.onLongPress(id, 'generateNode');
    }
  });

  const selectValue = isCustom ? 'custom' : currentRatioVal;

  let initialWidth = 512;
  let initialHeight = 512;
  if (isCustom) {
    const parts = currentRatioVal.split('x');
    initialWidth = parseInt(parts[0]) || 512;
    initialHeight = parseInt(parts[1]) || 512;
  }

  const [localWidth, setLocalWidth] = useState(initialWidth);
  const [localHeight, setLocalHeight] = useState(initialHeight);

  React.useEffect(() => {
    if (isCustom) {
      const parts = currentRatioVal.split('x');
      const w = parseInt(parts[0]) || 512;
      const h = parseInt(parts[1]) || 512;
      setLocalWidth(w);
      setLocalHeight(h);
    }
  }, [currentRatioVal, isCustom]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      if (data.onGenerate) {
        await data.onGenerate(id);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      ref={ref}
      className="bg-[#222] text-white rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.8)] border border-gray-600 w-[280px] flex flex-col p-4 z-50 cursor-pointer select-none active:brightness-95"
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-[#FFCC00] hover:!scale-150 !border-2 !border-zinc-800 transition-all cursor-pointer shadow-md" 
      />
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm">Generate Config (生成設定)</h3>
        <div className="flex gap-1 text-[10px] bg-[#333] px-2 py-1 rounded-md text-gray-400">
           <span>Model</span> | <span>Params</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-gray-400">Model (模型)</label>
        <select 
          className="bg-[#111] border border-[#444] rounded-md p-1.5 text-xs outline-none cursor-pointer"
          value={data.modelName || 'gemini-2.5-flash-image'}
          onChange={(e) => {
            if (data.onChange) data.onChange(id, { ...data, modelName: e.target.value });
          }}
        >
           <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
           <option value="dall-e-3">DALL-E 3</option>
        </select>

        <div className="flex gap-2">
           <div className="flex-1 flex flex-col gap-1">
             <label className="text-[10px] font-semibold text-gray-400">Aspect Ratio (長寬比)</label>
             <select 
                className="bg-[#111] border border-[#444] rounded-md p-1 text-xs outline-none cursor-pointer"
                value={selectValue}
                onChange={(e) => {
                  if (data.onChange) {
                    if (e.target.value === 'custom') {
                      data.onChange(id, { ...data, aspectRatio: `${localWidth}x${localHeight}` });
                    } else {
                      data.onChange(id, { ...data, aspectRatio: e.target.value });
                    }
                  }
                }}
             >
                <option value="1024x1024">1:1 (Square / 正方形)</option>
                <option value="1024x576">16:9 (Widescreen / 寬款)</option>
                <option value="576x1024">9:16 (Portrait / 雙款)</option>
                <option value="1024x768">4:3 (Classic / 橫式)</option>
                <option value="768x1024">3:4 (Vertical / 直式)</option>
                <option value="1024x438">21:9 (Cinematic / 電影)</option>
                <option value="custom">Custom (自訂尺寸)</option>
             </select>
           </div>
           <div className="flex flex-col gap-1 w-16">
             <label className="text-[10px] font-semibold text-gray-400">Count (數量)</label>
             <input 
                type="number" min="1" max="4" 
                className="bg-[#111] border border-[#444] rounded-md p-1 text-xs outline-none text-center"
                value={data.count || 1}
                onChange={(e) => {
                  if (data.onChange) data.onChange(id, { ...data, count: parseInt(e.target.value) || 1 });
                }}
             />
           </div>
        </div>

        {isCustom && (
           <div className="bg-[#181818] border border-[#333] p-2.5 rounded-lg flex flex-col gap-1.5">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Custom Size (自訂尺寸 px)</span>
             <div className="flex items-center gap-2">
               <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500 font-bold">Width (寬)</span>
                  <input 
                     type="number"
                     min="128"
                     max="2048"
                     step="64"
                     className="bg-[#0b0b0b] border border-[#333] rounded p-1 text-xs outline-none text-center font-mono focus:border-[#FFCC00]"
                     value={localWidth}
                     onChange={(e) => {
                        const val = parseInt(e.target.value) || 512;
                        setLocalWidth(val);
                        if (data.onChange) data.onChange(id, { ...data, aspectRatio: `${val}x${localHeight}` });
                     }}
                  />
               </div>
               <span className="text-gray-500 self-end mb-1 text-xs font-bold">×</span>
               <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-500 font-bold">Height (高)</span>
                  <input 
                     type="number"
                     min="128"
                     max="2048"
                     step="64"
                     className="bg-[#0b0b0b] border border-[#333] rounded p-1 text-xs outline-none text-center font-mono focus:border-[#FFCC00]"
                     value={localHeight}
                     onChange={(e) => {
                        const val = parseInt(e.target.value) || 512;
                        setLocalHeight(val);
                        if (data.onChange) data.onChange(id, { ...data, aspectRatio: `${localWidth}x${val}` });
                     }}
                  />
               </div>
             </div>
           </div>
        )}

        <button 
           onClick={handleGenerate}
           disabled={isGenerating}
           className="mt-2 w-full py-2 bg-[#FFCC00] text-black hover:bg-yellow-400 transition-colors rounded-lg font-extrabold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
           {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> Generate (生成)</>}
        </button>
      </div>

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
