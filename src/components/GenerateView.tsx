import React, { useState, useRef } from 'react';
import { Trash2, Sparkles, Loader2, ArrowUpCircle } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { ImageUploader } from './ImageUploader';
import { DrawingCanvas } from './DrawingCanvas';
import { GalleryItem } from '../types';
import { motion, useMotionValue, useVelocity, useTransform, useSpring } from 'motion/react';

interface Props {
  apiUrl: string;
  apiKey: string;
  modelName: string;
  onGenerateSuccess: (url: string, prompt: string) => void;
  pendingImage: {url: string, prompt: string} | null;
  clearPending: () => void;
  galleryItems: GalleryItem[];
  setGalleryItems: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  lang: 'en' | 'zh';
}

export function GenerateView({ apiUrl, apiKey, modelName, onGenerateSuccess, pendingImage, clearPending, galleryItems, setGalleryItems, lang }: Props) {
  const [prompt, setPrompt] = useState('');
  const [inputType, setInputType] = useState<'text' | 'image' | 'draw'>('text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  const t = {
    en: {
        input: 'Input',
        textToImage: 'Text-to-Image',
        imageToImage: 'Image-to-Image',
        drawToImage: 'Draw-to-Image',
        baseImages: 'Base Images',
        drawing: 'Drawing',
        prompt: 'Prompt',
        placeholder: 'A photorealistic cat astronaut on Mars...',
        generate: 'Generate!',
        virtualWall: 'Virtual Wall',
        waiting: 'Waiting for prompt',
        generating: 'Generating...',
        dragUp: 'Drag Up To Wall',
        doodle: 'Generated Doodle'
    },
    zh: {
        input: '輸入',
        textToImage: '文字轉圖片',
        imageToImage: '圖片轉圖片',
        drawToImage: '繪畫轉圖片',
        baseImages: '參考圖片',
        drawing: '繪圖',
        prompt: '提示詞',
        placeholder: '火星上逼真的太空貓咪...',
        generate: '生成！',
        virtualWall: '虛擬照片牆',
        waiting: '等待提示詞',
        generating: '生成中...',
        dragUp: '向上拖曳至相片牆',
        doodle: '生成的圖片'
    }
  }[lang];

  const handleGenerate = async () => {
    if (inputType === 'text' && !prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    clearPending();
    
    try {
      let imageUrl = '';
      if (!apiUrl) {
         await new Promise(r => setTimeout(r, 2000));
         imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt || 'Random aesthetic doodle art')}?width=1024&height=1024&nologo=true`;
      } else {
         const res = await fetch(apiUrl, {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${apiKey}`,
                 'x-goog-api-key': apiKey
             },
             body: JSON.stringify({
                 prompt: prompt || 'Generate image in doodle sketch style',
                 model: modelName
             })
         });
         
         if (!res.ok) throw new Error(`API Error: ${res.status}`);
         const data = await res.json();
         imageUrl = data?.data?.[0]?.url || data?.predictions?.[0]?.bytesBase64Encoded || data?.url || data?.image || `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt || 'Random aesthetic')}?nologo=true`;
         if (data?.predictions?.[0]?.bytesBase64Encoded) {
             imageUrl = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
         }
      }
      
      onGenerateSuccess(imageUrl, prompt || 'Generated Image');
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    // If dragged upwards past a threshold
    if (info.offset.y < -50 && pendingImage) {
      const paddingX = 40;
      // Get the bounding box of the right panel
      const galleryWidth = window.innerWidth * 0.6; // rough estimate, right panel is flex-1
      const galleryHeight = window.innerHeight * 0.7; // top 70% of screen
      
      const randomX = Math.max(paddingX, Math.random() * galleryWidth - 300);
      const randomY = Math.max(paddingX, Math.random() * galleryHeight - 200);
      const randomRot = Math.random() * 40 - 20;

      const newItem: GalleryItem = {
        id: Date.now().toString(),
        url: pendingImage.url,
        prompt: pendingImage.prompt,
        x: randomX,
        y: randomY,
        rotation: randomRot
      };

      setGalleryItems([...galleryItems, newItem]);
      clearPending();
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[450px] bg-white border-4 border-black shadow-[8px_8px_0_0_#000] flex flex-col rounded-2xl overflow-hidden shrink-0 h-full">
        <div className="border-b-4 border-black p-5 flex justify-between items-center bg-[#f8f9fa] bg-white/60 backdrop-blur-sm">
          <span className="text-xl font-black uppercase tracking-tight">{t.input}</span>
          <select 
            value={inputType} 
            onChange={(e) => setInputType(e.target.value as any)}
            className="border-4 border-black p-2 text-sm font-bold rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-[#FFCC00] text-black cursor-pointer shadow-[4px_4px_0_0_#000]"
          >
            <option value="text">{t.textToImage}</option>
            <option value="image">{t.imageToImage}</option>
            <option value="draw">{t.drawToImage}</option>
          </select>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto bg-white/40 backdrop-blur-md">
          <div className="flex-col flex gap-6">
            
            {inputType === 'image' && (
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-3">
                  {t.baseImages}
                </label>
                <ImageUploader images={images} setImages={setImages} />
              </div>
            )}
            
            {inputType === 'draw' && (
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-3">
                  {t.drawing}
                </label>
                <DrawingCanvas canvasRef={drawingCanvasRef} />
              </div>
            )}

            <div>
              <label className="block text-sm font-black uppercase tracking-widest mb-3">
                {t.prompt}
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="w-full h-32 p-4 bg-white/80 backdrop-blur-sm border-4 border-black rounded-xl font-bold text-sm focus:ring-4 focus:ring-[#FFCC00] outline-none transition-all resize-none shadow-[4px_4px_0_0_#000]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 flex gap-4 border-t-4 border-black bg-white/60 backdrop-blur-sm mt-auto">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || (inputType === 'text' && !prompt.trim())}
            className="flex-1 py-4 bg-[#FFCC00] text-black font-black uppercase text-lg border-4 border-black tracking-widest hover:bg-yellow-400 transition-colors rounded-xl shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isGenerating ? <Loader2 className="animate-spin w-6 h-6" /> : t.generate}
          </button>
          <button 
            onClick={() => {
                setPrompt('');
                setImages([]);
                if (drawingCanvasRef.current) {
                    const ctx = drawingCanvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0,0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
                    }
                }
            }}
            className="px-5 border-4 border-black hover:bg-gray-200 transition-colors rounded-xl bg-white shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
            title="Clear all"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* RIGHT PANEL - Virtual Picture Wall and Camera */}
      <div className="flex-1 bg-[#f8f9fa] border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] rounded-2xl flex flex-col relative overflow-hidden"
           style={{ backgroundImage: 'radial-gradient(#ddd 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
         
         <div className="absolute inset-0 pointer-events-none z-10 p-6 opacity-30">
             <h1 className="text-4xl font-black uppercase tracking-widest text-black">{t.virtualWall}</h1>
         </div>

        {/* The Wall Area (Gallery) */}
        <div className="absolute inset-0 z-20">
           {galleryItems.map((item, i) => (
              <GalleryPhoto key={item.id} item={item} initialZ={i} />
           ))}
        </div>

        {/* Bottom Section - Camera Base */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-transparent z-30 flex items-end justify-center pointer-events-none">
            
            <div className="relative flex flex-col items-center pb-8 pointer-events-auto">
              
              {/* Camera */}
              <TiltCard className="z-20">
                <div className="w-72 h-48 bg-[#3d3d3d] rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative border-b-8 border-[#2d2d2d] flex flex-col items-center justify-center group transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
                  <div className="absolute top-4 left-4 w-12 h-8 bg-[#2d2d2d] rounded-md border border-[#4d4d4d] transition-transform duration-300" style={{ transform: 'translateZ(10px)' }}></div>
                  <div className="w-24 h-24 rounded-full border-[6px] border-[#2d2d2d] bg-[#1a1a1a] flex items-center justify-center shadow-inner relative transition-transform duration-500 ease-out group-hover:scale-105" style={{ transform: 'translateZ(25px)' }}>
                    <div className="w-12 h-12 rounded-full bg-[#111] border border-[#333] shadow-inner"></div>
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white opacity-20"></div>
                  </div>
                  <div className={`${isGenerating ? 'bg-[#c0392b] border-[#e74c3c] scale-95' : 'bg-[#e74c3c] border-[#c0392b] group-hover:scale-110 active:scale-95'} absolute top-4 right-6 w-10 h-10 rounded-full border-4 shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-all cursor-pointer`} style={{ transform: 'translateZ(35px)' }} onClick={handleGenerate}></div>
                  <div className="absolute -bottom-2 w-64 h-2 bg-[#111] rounded-full blur-[2px]" style={{ transform: 'translateZ(-10px)' }}></div>
                  
                  <div className="absolute top-0 w-[200px] h-3 bg-[#111] rounded-b-lg shadow-inner" style={{ transform: 'translateZ(-2px)' }}></div>
                </div>
              </TiltCard>

              {/* Generated Image Output */}
              {isGenerating ? (
                <div className="absolute -top-32 flex flex-col items-center gap-2 text-black bg-white/80 p-4 rounded-xl border-4 border-black">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="font-black uppercase tracking-widest text-xs">{t.generating}</p>
                </div>
              ) : error ? (
                <div className="absolute -top-32 bg-white text-red-500 font-bold p-4 text-center border-4 border-black rounded-xl shadow-[4px_4px_0_0_#000]">{error}</div>
              ) : pendingImage ? (
                <DraggablePendingPhoto pendingImage={pendingImage} handleDragEnd={handleDragEnd} t={t} />
              ) : (
                <div className="absolute -top-20 flex flex-col items-center gap-2 text-gray-500 bg-white/90 px-6 py-3 rounded-full border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
                  <Sparkles className="w-6 h-6" />
                  <p className="font-black uppercase tracking-widest text-[10px]">{t.waiting}</p>
                </div>
              )}

            </div>
        </div>
      </div>
    </div>
  );
}

function DraggablePendingPhoto({ pendingImage, handleDragEnd, t }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(80);

  const xVelocity = useVelocity(x);
  const yVelocity = useVelocity(y);

  const rotateX = useTransform(yVelocity, [-1500, 1500], [45, -45]);
  const rotateY = useTransform(xVelocity, [-1500, 1500], [-45, 45]);
  
  const springRotateX = useSpring(rotateX, { damping: 25, stiffness: 250 });
  const springRotateY = useSpring(rotateY, { damping: 25, stiffness: 250 });

  return (
    <motion.div 
        drag
        dragConstraints={{ left: -100, right: 100, bottom: 200 }}
        onDragEnd={handleDragEnd}
        className="absolute top-[-160px] z-40 cursor-grab active:cursor-grabbing origin-bottom"
        initial={{ y: 80, scale: 0.1, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        style={{ x, y, rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 1200 }}
    >
      <TiltCard className="w-64 h-auto block select-none group">
        <div className="w-full bg-white p-3 shadow-2xl border-4 border-black rounded-xl flex flex-col relative pointer-events-none select-none transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#FFCC00] px-4 py-1 border-4 border-black rounded-full font-black text-[10px] uppercase shadow-[4px_4px_0_0_#000] z-50 animate-bounce" style={{ transform: 'translateZ(30px)' }}>
              {t.dragUp} <ArrowUpCircle size={14} />
          </div>
          <div className="w-full aspect-square bg-gray-100 border-4 border-black overflow-hidden flex items-center justify-center relative rounded-md" style={{ transform: 'translateZ(10px)' }}>
            <img src={pendingImage.url} alt="Generated" className="w-full h-full object-cover" />
          </div>
          <div className="mt-3 flex flex-col items-center justify-center text-black pb-2" style={{ transform: 'translateZ(20px)' }}>
            <p className="text-sm font-bold truncate px-2 w-full text-center leading-tight">
              {pendingImage.prompt || t.doodle}
            </p>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

function GalleryPhoto({ item, initialZ }: { item: GalleryItem, initialZ: number }) {
  const [zIndex, setZIndex] = useState(initialZ);
  
  const x = useMotionValue(window.innerWidth / 2 - 100);
  const y = useMotionValue(window.innerHeight - 200);

  const xVelocity = useVelocity(x);
  const yVelocity = useVelocity(y);

  const rotateX = useTransform(yVelocity, [-1500, 1500], [60, -60]);
  const rotateY = useTransform(xVelocity, [-1500, 1500], [-60, 60]);
  
  const springRotateX = useSpring(rotateX, { damping: 20, stiffness: 200 });
  const springRotateY = useSpring(rotateY, { damping: 20, stiffness: 200 });
  
  return (
    <motion.div
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.1, zIndex: 100 }}
        whileDrag={{ scale: 1.1, zIndex: 100 }}
        onDragStart={() => setZIndex(Date.now())}
        initial={{ y: window.innerHeight - 200, x: window.innerWidth / 2 - 100, scale: 1, opacity: 0 }}
        animate={{ y: item.y, x: item.x, scale: 0.6, rotateZ: item.rotation, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        style={{ 
            x, 
            y, 
            rotateX: springRotateX, 
            rotateY: springRotateY, 
            zIndex, 
            position: 'absolute',
            transformPerspective: 1200
        }}
        className="w-64 h-auto cursor-grab active:cursor-grabbing origin-center"
    >
        <div className="w-full bg-white p-3 shadow-[8px_8px_0_0_rgba(0,0,0,0.3)] border-4 border-black flex flex-col relative rounded-xl transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
            {/* Duct tape */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-16 h-8 bg-gray-200/90 border-2 border-black rotate-[-5deg] mix-blend-multiply z-20" style={{ transform: 'translateZ(10px)' }}></div>

            <div className="w-full aspect-square bg-gray-100 border-4 border-black overflow-hidden flex items-center justify-center relative rounded-md pointer-events-none" style={{ transform: 'translateZ(5px)' }}>
            <img src={item.url} draggable={false} alt={item.prompt} className="w-full h-full object-cover" />
            </div>
            <div className="mt-3 flex flex-col items-center justify-center text-black pb-2 pointer-events-none" style={{ transform: 'translateZ(15px)' }}>
            <p className="text-lg font-black truncate px-2 w-full text-center leading-tight">
                {item.prompt}
            </p>
            </div>
        </div>
    </motion.div>
  );
}

