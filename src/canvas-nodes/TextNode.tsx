import React from 'react';
import { Handle, Position } from 'reactflow';
import { useLongPress } from '../hooks/useLongPress';

export function TextNode({ data, isConnectable, id }: any) {
  const { ref } = useLongPress(() => {
    if (data.onLongPress) {
      data.onLongPress(id, 'textNode');
    }
  });

  return (
    <div 
      ref={ref}
      className="bg-[#2a2a2a] text-white rounded-xl shadow-lg border-2 border-gray-600 outline-none w-64 min-h-[100px] flex flex-col group p-3 cursor-pointer select-none active:brightness-95"
    >
      {/* Target handle on left */}
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className="!w-4 !h-4 !bg-[#FFCC00] hover:!scale-150 !border-2 !border-zinc-800 transition-all cursor-pointer shadow-md" 
      />
      
      <div className="flex-1 w-full h-full">
         <textarea 
            className="w-full h-full bg-transparent resize-none outline-none text-sm font-medium"
            placeholder="Type your prompt here..."
            defaultValue={data.text}
            onChange={(e) => {
              if (data.onChange) data.onChange(id, e.target.value);
            }}
         />
      </div>

      {/* Source handle on right */}
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
