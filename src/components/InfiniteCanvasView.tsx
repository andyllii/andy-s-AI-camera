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
import { Plus, Image as ImageIcon, Type, Settings as SettingsIcon, Edit2, Trash2, Map as MapIcon, Sun, Moon, LayoutPanelLeft, Workflow } from 'lucide-react';
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
  currentView: 'standard' | 'canvas';
  setCurrentView: (view: 'standard' | 'canvas') => void;
  lang: 'en' | 'zh';
  setLang: (lang: 'en' | 'zh') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onOpenSettings: () => void;
}

function CanvasContent({ 
  apiUrl, 
  apiKey, 
  enableUpload,
  currentView,
  setCurrentView,
  lang,
  setLang,
  theme,
  setTheme,
  onOpenSettings
}: Props) {
  const store = useCanvasStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const [clipboard, setClipboard] = useState<{nodes: Node[], edges: Edge[]}>({nodes: [], edges: []});
  const [showMinimap, setShowMinimap] = useState(true);

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
        preventScrolling={true}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
           style: { stroke: '#b1b1b7', strokeWidth: 2 },
           type: 'smoothstep',
        }}
        className="bg-[#1e1e1e]"
      >
        <Controls className="!bg-zinc-800 !border-2 !border-zinc-700/50 !rounded-xl !shadow-2xl text-white !bottom-24 !left-4" />
        {showMinimap && (
          <MiniMap 
            nodeStrokeColor={() => '#555'} 
            nodeColor={() => '#333'} 
            maskColor="rgba(0,0,0,0.5)" 
            className="!bg-zinc-900/60 !border !border-zinc-800 !rounded-xl overflow-hidden shadow-2xl"
          />
        )}
        <Background gap={24} size={1} color="#333" />
      </ReactFlow>

      {/* Modern HUD Header Bar - fully responsive & touch friendly */}
      <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Left HUD: Project Name Selector + Rename & Delete controls */}
        <div className="pointer-events-auto flex flex-row items-center gap-2 bg-[#2d2d2d]/95 backdrop-blur-md border border-[#444] rounded-2xl p-2 shadow-2xl w-full xl:w-auto overflow-x-auto no-scrollbar select-none">
          <div className="flex items-center gap-1.5 shrink-0 px-2 text-white font-extrabold text-[10px] sm:text-xs tracking-wider uppercase opacity-40">
            {lang === 'en' ? 'Canvas' : '畫布'}
          </div>
          
          <select 
             className="bg-[#1e1e1e] text-white border border-[#444] rounded-xl px-3 py-1.5 text-sm font-bold shadow-lg pr-8 outline-none focus:ring-2 focus:ring-[#FFCC00] max-w-[140px] sm:max-w-xs transition-all cursor-pointer h-11 flex items-center shrink-0"
             value={store.currentProjectId || ''}
             onChange={(e) => {
                if (e.target.value === 'new') {
                   store.createProject(`${lang === 'en' ? 'Canvas' : '畫布'} ${store.projects.length + 1}`);
                } else {
                   store.switchProject(e.target.value);
                }
             }}
          >
             {store.projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
             ))}
             {store.projects.length === 0 && <option value="" disabled>No canvases</option>}
             <option value="new">+ {lang === 'en' ? 'New Canvas' : '新增畫布'}</option>
          </select>
          
          {store.currentProjectId && (
             <div className="flex gap-2 shrink-0">
               <button 
                  onClick={() => {
                     const p = store.projects.find(p=>p.id===store.currentProjectId);
                     if (!p) return;
                     const name = prompt(lang === 'en' ? "Rename canvas to:" : "將畫布重新命名為：", p.name);
                     if (name && name.trim()) store.renameProject(p.id, name.trim());
                  }}
                  className="h-11 w-11 flex items-center justify-center bg-[#1e1e1e] hover:bg-[#3d3d3d] active:scale-95 text-gray-300 hover:text-white rounded-xl border border-[#444] transition-all"
                  title={lang === 'en' ? "Rename Canvas" : "重新命名畫布"}
                >
                  <Edit2 size={16} />
               </button>
               <button 
                  onClick={() => {
                     if(confirm(lang === 'en' ? "Delete this canvas forever?" : "確定永久刪除這個畫布嗎？")) store.deleteProject(store.currentProjectId!);
                  }}
                  className="h-11 w-11 flex items-center justify-center bg-red-950/40 hover:bg-red-600 active:scale-95 text-red-300 hover:text-white rounded-xl border border-red-900/40 transition-all"
                  title={lang === 'en' ? "Delete Canvas" : "刪除畫布"}
                >
                  <Trash2 size={16} />
               </button>
             </div>
          )}
        </div>

        {/* Right HUD: System Controls & Mode Switchers (Horizontally scrolls if narrow) */}
        <div className="pointer-events-auto flex flex-row items-center justify-between xl:justify-end gap-2 bg-[#2d2d2d]/95 backdrop-blur-md border border-[#444] rounded-2xl p-2 shadow-2xl w-full xl:w-auto overflow-x-auto no-scrollbar select-none">
          {/* View Segment Modes - 44px high targets */}
          <div className="flex items-center p-1 bg-[#1e1e1e] border border-[#444] rounded-xl shrink-0 h-11">
            <button 
              onClick={() => setCurrentView('standard')}
              className={`px-3.5 h-8 rounded-lg font-extrabold text-xs flex items-center gap-1.5 transition-all ${currentView === 'standard' ? 'bg-[#FFCC00] text-black shadow-inner shadow-black/10' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutPanelLeft size={14} />
              <span>{lang === 'en' ? 'Basic' : '標準模式'}</span>
            </button>
            <button 
              onClick={() => setCurrentView('canvas')}
              className={`px-3.5 h-8 rounded-lg font-extrabold text-xs flex items-center gap-1.5 transition-all ${currentView === 'canvas' ? 'bg-[#FFCC00] text-black shadow-inner shadow-black/10' : 'text-gray-400 hover:text-white'}`}
            >
              <Workflow size={14} />
              <span>{lang === 'en' ? 'Canvas' : '無限畫布'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Translate control */}
            <button 
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="h-11 px-4 flex items-center justify-center bg-[#1e1e1e] hover:bg-[#3d3d3d] text-white rounded-xl border border-[#444] font-black text-xs transition-all active:scale-95"
              title={lang === 'en' ? "Switch Language" : "切換語言"}
            >
              {lang === 'en' ? '繁中' : 'ENG'}
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-11 w-11 flex items-center justify-center bg-[#1e1e1e] hover:bg-[#3d3d3d] text-white rounded-xl border border-[#444] transition-all active:scale-95"
              title={lang === 'en' ? "Toggle Theme" : "切換色彩"}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* MiniMap Toggle switch */}
            <button 
              onClick={() => setShowMinimap(!showMinimap)}
              className={`h-11 w-11 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${showMinimap ? 'bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]/30 hover:bg-[#FFCC00]/20' : 'bg-[#1e1e1e] text-gray-400 border border-[#444] hover:bg-[#3d3d3d]'}`}
              title={lang === 'en' ? "Toggle Minimap" : "開關小地圖"}
            >
              <MapIcon size={16} />
            </button>

            {/* Application Configuration Settings */}
            <button 
              onClick={onOpenSettings}
              className="h-11 w-11 flex items-center justify-center bg-[#1e1e1e] hover:bg-[#3d3d3d] text-white rounded-xl border border-[#444] transition-all active:scale-95"
              title={lang === 'en' ? "Settings" : "設定"}
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toolbar - larger console/dock styling */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#2d2d2d]/95 backdrop-blur-md border border-[#444] rounded-2xl shadow-2xl p-2 flex gap-3 z-50 transition-all">
        <button 
          className="w-12 h-12 flex items-center justify-center bg-[#1e1e1e]/80 hover:bg-[#444] text-white hover:scale-110 active:scale-95 rounded-xl transition-all border border-zinc-800" 
          title={lang === 'en' ? "Add Text Node" : "新增文字節點"} 
          onClick={addTextNode}
        >
          <Type size={20} />
        </button>
        <button 
          className="w-12 h-12 flex items-center justify-center bg-[#1e1e1e]/80 hover:bg-[#444] text-white hover:scale-110 active:scale-95 rounded-xl transition-all border border-zinc-800" 
          title={lang === 'en' ? "Add Image Node" : "新增圖片節點"} 
          onClick={addImageNode}
        >
          <ImageIcon size={20} />
        </button>
        <button 
          className="w-12 h-12 flex items-center justify-center bg-[#1e1e1e]/80 hover:bg-[#444] text-white hover:scale-110 active:scale-95 rounded-xl transition-all border border-zinc-800" 
          title={lang === 'en' ? "Add Generation Config" : "新增生成設定"} 
          onClick={addGenerateNode}
        >
          <SettingsIcon size={20} />
        </button>
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
