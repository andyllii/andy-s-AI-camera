import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Sparkles, Loader2 } from 'lucide-react';

export function GenerateNode({ data, isConnectable, id }: any) {
  const [isGenerating, setIsGenerating] = useState(false);

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
    <div className="bg-[#222] text-white rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.8)] border border-gray-600 w-[280px] flex flex-col p-4 z-50">
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-gray-400" />
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm">Generate Config</h3>
        <div className="flex gap-1 text-[10px] bg-[#333] px-2 py-1 rounded-md text-gray-400">
           <span>Model</span> | <span>Params</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-gray-400">Model</label>
        <select 
          className="bg-[#111] border border-[#444] rounded-md p-1.5 text-xs outline-none"
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
             <label className="text-[10px] font-semibold text-gray-400">Aspect Ratio</label>
             <select 
                className="bg-[#111] border border-[#444] rounded-md p-1 text-xs outline-none"
                value={data.aspectRatio || '1024x1024'}
                onChange={(e) => {
                  if (data.onChange) data.onChange(id, { ...data, aspectRatio: e.target.value });
                }}
             >
                <option value="1024x1024">1:1</option>
                <option value="1024x576">16:9</option>
                <option value="576x1024">9:16</option>
             </select>
           </div>
           <div className="flex flex-col gap-1 w-16">
             <label className="text-[10px] font-semibold text-gray-400">Count</label>
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

        <button 
           onClick={handleGenerate}
           disabled={isGenerating}
           className="mt-2 w-full py-2 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
           {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> Generate</>}
        </button>
      </div>

      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} className="w-3 h-3 bg-gray-400" />
    </div>
  );
}
