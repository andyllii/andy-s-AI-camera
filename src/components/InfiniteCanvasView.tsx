import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  ConnectionMode,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

import { TextNode } from '../canvas-nodes/TextNode';
import { ImageNode } from '../canvas-nodes/ImageNode';
import { GenerateNode } from '../canvas-nodes/GenerateNode';
import { generateImage } from '../lib/generateImage';
import { useCanvasStore } from '../store/canvasStore';
import { Plus, Image as ImageIcon, Type, Settings as SettingsIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  generateNode: GenerateNode,
};

interface Props {
  apiUrl: string;
  apiKey: string;
  enableUpload: boolean;
}

function CanvasContent({ apiUrl, apiKey, enableUpload }: Props) {
  const store = useCanvasStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const [clipboard, setClipboard] = useState<{nodes: Node[], edges: Edge[]}>({nodes: [], edges: []});

  useEffect(() => {
    store.loadProjects();
  }, []);

  const onNodesChange = store.onNodesChange;
  const onEdgesChange = store.onEdgesChange;
  const onConnect = store.onConnect;

  const handleNodeChange = (id: string, data: any) => {
    store.setNodes(store.nodes.map(n => {
      if (n.id === id) {
        if (typeof data === 'string') {
          return { ...n, data: { ...n.data, text: data } };
        }
        return { ...n, data: { ...n.data, ...data } };
      }
      return n;
    }));
  };

  const handleGenerateClick = async (nodeId: string) => {
    const incomingEdges = store.edges.filter(e => e.target === nodeId);
    const upstreamNodes = incomingEdges.map(e => store.nodes.find(n => n.id === e.source)).filter(Boolean) as Node[];

    const textPrompts = upstreamNodes.filter(n => n.type === 'textNode').map(n => n.data.text).filter(Boolean);
    const baseImages = upstreamNodes.filter(n => n.type === 'imageNode' && n.data.url).map(n => n.data.url).filter(Boolean);

    const generateNode = store.nodes.find(n => n.id === nodeId);
    const config = generateNode?.data || {};

    let combinedPrompt = textPrompts.join(', ');
    if (!combinedPrompt) combinedPrompt = 'Random generated image';

    const count = config.count || 1;
    const newImageNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const startX = (generateNode?.position.x || 0) + 400;
    const startY = (generateNode?.position.y || 0) - ((count - 1) * 150);

    for (let i = 0; i < count; i++) {
        try {
            const imageUrl = await generateImage({
                apiUrl,
                apiKey,
                modelName: config.modelName || 'gemini-2.5-flash-image',
                prompt: combinedPrompt,
                baseImages: baseImages.length > 0 ? [baseImages[0]] : undefined,
                imageSize: config.aspectRatio || '1024x1024'
            });
            
            let finalUrl = imageUrl;
            if (enableUpload && imageUrl.startsWith('data:')) {
                try {
                    const upRes = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ base64: imageUrl, filename: `canvas-${Date.now()}.png` })
                    });
                    const upData = await upRes.json();
                    if (upData.url) finalUrl = upData.url;
                } catch(e) {}
            }

            const newNodeId = uuidv4();
            newImageNodes.push({
                id: newNodeId,
                type: 'imageNode',
                position: { x: startX, y: startY + (i * 300) },
                data: { url: finalUrl, label: combinedPrompt }
            });

            newEdges.push({
                id: `e-${nodeId}-${newNodeId}`,
                source: nodeId,
                target: newNodeId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#fff', strokeWidth: 2 }
            });

        } catch(e) {
            console.error('Generation failed', e);
        }
    }

    if (newImageNodes.length > 0) {
        store.setNodes([...store.nodes, ...newImageNodes]);
        store.setEdges([...store.edges, ...newEdges]);
    }
  };

  const addTextNode = () => {
    store.addNode({
      id: uuidv4(),
      type: 'textNode',
      position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 },
      data: { text: '', onChange: handleNodeChange }
    });
  };

  const addImageNode = () => {
    store.addNode({
      id: uuidv4(),
      type: 'imageNode',
      position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 },
      data: { url: '', label: '' }
    });
  };

  const addGenerateNode = () => {
    store.addNode({
      id: uuidv4(),
      type: 'generateNode',
      position: { x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 - 100 },
      data: { onChange: handleNodeChange, onGenerate: handleGenerateClick }
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + C (Copy)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selectedNodes = store.nodes.filter(n => n.selected);
        const selectedIds = new Set(selectedNodes.map(n => n.id));
        const selectedEdges = store.edges.filter(e => selectedIds.has(e.source) && selectedIds.has(e.target));
        setClipboard({ nodes: selectedNodes, edges: selectedEdges });
      }
      
      // Ctrl/Cmd + V (Paste)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboard.nodes.length === 0) return;
        
        const idMap = new Map<string, string>();
        const newNodes = clipboard.nodes.map(n => {
           const newId = uuidv4();
           idMap.set(n.id, newId);
           return {
             ...n,
             id: newId,
             position: { x: n.position.x + 50, y: n.position.y + 50 },
             selected: true
           };
        });
        
        const newEdges = clipboard.edges.map(e => ({
           ...e,
           id: uuidv4(),
           source: idMap.get(e.source) || e.source,
           target: idMap.get(e.target) || e.target,
           selected: true
        }));

        store.setNodes([...store.nodes.map(n => ({...n, selected: false})), ...newNodes]);
        store.setEdges([...store.edges.map(e => ({...e, selected: false})), ...newEdges]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store.nodes, store.edges, clipboard]);


  const processedNodes = store.nodes.map(n => {
    if (n.type === 'textNode') return { ...n, data: { ...n.data, onChange: handleNodeChange } };
    if (n.type === 'generateNode') return { ...n, data: { ...n.data, onChange: handleNodeChange, onGenerate: handleGenerateClick } };
    if (n.type === 'imageNode') return { ...n, data: { ...n.data, onChange: handleNodeChange } };
    return n;
  });

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={processedNodes}
        edges={store.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
           style: { stroke: '#b1b1b7', strokeWidth: 2 },
           type: 'smoothstep',
        }}
        className="bg-[#1e1e1e]"
      >
        <Controls />
        <MiniMap nodeStrokeColor={() => '#555'} nodeColor={() => '#333'} maskColor="rgba(0,0,0,0.5)" />
        <Background gap={24} size={1} color="#333" />
      </ReactFlow>

      {/* Floating Toolbar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#2d2d2d] border border-[#444] rounded-2xl shadow-2xl p-2 flex gap-2 z-50 transition-all">
        <button className="p-3 text-white hover:bg-[#444] hover:scale-110 active:scale-95 rounded-xl transition-all" title="Add Text Node" onClick={addTextNode}>
          <Type size={20} />
        </button>
        <button className="p-3 text-white hover:bg-[#444] hover:scale-110 active:scale-95 rounded-xl transition-all" title="Add Image Node" onClick={addImageNode}>
          <ImageIcon size={20} />
        </button>
        <button className="p-3 text-white hover:bg-[#444] hover:scale-110 active:scale-95 rounded-xl transition-all" title="Add Generation Config" onClick={addGenerateNode}>
          <SettingsIcon size={20} />
        </button>
      </div>

      {/* Project Selector */}
      <div className="absolute top-[80px] left-4 sm:top-4 z-50 flex flex-col gap-2">
        <select 
           className="bg-[#2d2d2d] text-white border border-[#444] rounded-xl px-4 py-2 font-bold shadow-lg pr-8 outline-none focus:ring-2 focus:ring-[#FFCC00]"
           value={store.currentProjectId || ''}
           onChange={(e) => {
              if (e.target.value === 'new') {
                 store.createProject(`Canvas ${store.projects.length + 1}`);
              } else {
                 store.switchProject(e.target.value);
              }
           }}
        >
           {store.projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
           ))}
           {store.projects.length === 0 && <option value="" disabled>No canvases</option>}
           <option value="new">+ New Canvas</option>
        </select>
        
        {store.currentProjectId && (
           <div className="flex gap-2 isolate">
             <button 
                onClick={() => {
                   const p = store.projects.find(p=>p.id===store.currentProjectId);
                   if (!p) return;
                   const name = prompt("Rename canvas to:", p.name);
                   if (name && name.trim()) store.renameProject(p.id, name.trim());
                }}
                className="bg-[#2d2d2d] text-[10px] font-bold text-gray-300 hover:text-white px-2 py-1 rounded w-fit border border-[#444] uppercase"
              >
                Rename
             </button>
             <button 
                onClick={() => {
                   if(confirm("Delete this canvas forever?")) store.deleteProject(store.currentProjectId!);
                }}
                className="bg-red-900/50 text-[10px] font-bold text-red-300 hover:text-white hover:bg-red-600 px-2 py-1 rounded w-fit border border-red-800 uppercase"
              >
                Delete
             </button>
           </div>
        )}
      </div>
    </div>
  );
}

export function InfiniteCanvasView(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasContent {...props} />
    </ReactFlowProvider>
  );
}
