import React, { useState, useRef } from 'react';
import { Trash2, Sparkles, Loader2, ArrowUpCircle, X, Download, ArrowLeftRight, Copy } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { ImageUploader } from './ImageUploader';
import { DrawingCanvas } from './DrawingCanvas';
import { MaskCanvas } from './MaskCanvas';
import { ImageCompareSlider } from './ImageCompareSlider';
import { EffectsOverlay, EffectType } from './EffectsOverlay';
import { GalleryItem } from '../types';
import { motion, useMotionValue, useVelocity, useTransform, useSpring } from 'motion/react';

interface Props {
  apiUrl: string;
  apiKey: string;
  modelName: string;
  onGenerateSuccess: (url: string, prompt: string, fullPrompt?: string, originalImage?: string) => void;
  pendingImage: {url: string, prompt: string, fullPrompt?: string, originalImage?: string} | null;
  clearPending: () => void;
  galleryItems: GalleryItem[];
  setGalleryItems: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  lang: 'en' | 'zh';
  theme: 'light' | 'dark';
  wallEffect?: EffectType;
  enableUpload?: boolean;
}

export function GenerateView({ apiUrl, apiKey, modelName, onGenerateSuccess, pendingImage, clearPending, galleryItems, setGalleryItems, lang, theme, wallEffect = 'none', enableUpload = true }: Props) {
  const [prompt, setPrompt] = useState('');
  const [inputType, setInputType] = useState<'text' | 'image' | 'draw' | 'attributes' | 'edit' | 'template'>('text');
  const [attributesList, setAttributesList] = useState<{name: string, value: string}[]>([{name: '', value: ''}]);
  const [imageStyle, setImageStyle] = useState('none');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<GalleryItem | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const t = {
    en: {
        input: 'Input',
        textToImage: 'Text-to-Image',
        imageToImage: 'Image-to-Image',
        drawToImage: 'Draw-to-Image',
        editToImage: 'Image Edit (Brush)',
        attributesMode: 'Attributes',
        templateMode: 'Template',
        optional: 'Optional',
        addAttribute: 'Add Attribute',
        baseImages: 'Base Images',
        drawing: 'Drawing',
        drawMask: 'Highlight Area to Edit',
        prompt: 'Prompt',
        placeholder: 'A photorealistic cat astronaut on Mars...',
        generate: 'Generate!',
        virtualWall: 'Virtual Wall',
        waiting: 'Waiting for prompt',
        generating: 'Generating...',
        dragUp: 'Drag Up To Wall',
        doodle: 'Generated Doodle',
        style: 'Style',
        size: 'Size',
        none: 'None',
        anime: 'Anime',
        photorealistic: 'Photorealistic',
        digitalArt: 'Digital Art',
        threeDRender: '3D Render',
        sketch: 'Sketch',
        download: 'Download',
        close: 'Close',
        compareOriginal: 'Compare with Original',
        showFullPrompt: 'Show Complete Prompt',
        copyPrompt: 'Copy'
    },
    zh: {
        input: '輸入',
        textToImage: '文字轉圖片',
        imageToImage: '圖片轉圖片',
        drawToImage: '繪畫轉圖片',
        editToImage: '圖片編輯 (筆刷)',
        attributesMode: '重點屬性',
        templateMode: '模板',
        optional: '選填',
        addAttribute: '新增重點',
        baseImages: '參考圖片',
        drawing: '繪圖',
        drawMask: '標記修改區域',
        prompt: '提示詞',
        placeholder: '火星上逼真的太空貓咪...',
        generate: '生成！',
        virtualWall: '虛擬照片牆',
        waiting: '等待提示詞',
        generating: '生成中...',
        dragUp: '向上拖曳至相片牆',
        doodle: '生成的圖片',
        style: '風格',
        size: '尺寸',
        none: '無',
        anime: '動漫',
        photorealistic: '寫實',
        digitalArt: '數位藝術',
        threeDRender: '3D渲染',
        sketch: '草圖',
        download: '下載',
        close: '關閉',
        compareOriginal: '比對原圖',
        showFullPrompt: '顯示完整提示詞',
        copyPrompt: '複製'
    }
  }[lang];

  React.useEffect(() => {
    if (inputType === 'template' && templates.length === 0) {
      fetch('/api/templates')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setTemplates(data);
        })
        .catch(err => console.error(err));
    }
  }, [inputType]);

  const isDark = theme === 'dark';

  const handleGenerate = async () => {
    if (inputType === 'text' && !prompt.trim()) return;
    if (inputType === 'template' && !selectedTemplate) return;
    if (inputType === 'attributes' && !attributesList.some(a => a.name.trim() || a.value.trim())) return;
    setIsGenerating(true);
    setError(null);
    clearPending();
    
    let basePrompt = inputType === 'attributes' ? attributesList.filter(a => a.name.trim() || a.value.trim()).map(a => `${a.name}: ${a.value}`).join(', ') : prompt;
    if (inputType === 'template') {
        basePrompt = selectedTemplate.prompt + (prompt ? ` ${prompt}` : '');
    }
    let finalPrompt = basePrompt || 'Random aesthetic image';
    if (imageStyle !== 'none') {
        finalPrompt += `, in ${imageStyle} style`;
    }
    
    let fullInstruction = `Mode: ${inputType}\nPrompt: ${finalPrompt}\nSize: ${imageSize}\nStyle: ${imageStyle}`;
    if (images.length > 0) fullInstruction += `\nBase Image: Yes`;
    if (inputType === 'draw' && drawingCanvasRef.current) fullInstruction += `\nDrawing: Yes`;
    if (inputType === 'edit' && maskCanvasRef.current) fullInstruction += `\nMask: Yes`;

    const [width, height] = imageSize.split('x');

    try {
      let imageUrl = '';
      if (!apiUrl) {
         if (!process.env.GEMINI_API_KEY) {
             throw new Error("GEMINI_API_KEY is missing. Add it to environment variables to use the built-in Gemini image model.");
         }
         const { GoogleGenAI } = await import('@google/genai');
         const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
         
         let aspectRatio = '1:1';
         if (imageSize === '1024x576') aspectRatio = '16:9';
         if (imageSize === '576x1024') aspectRatio = '9:16';
         
         const parts: any[] = [];
         let base64Source = '';
         if (inputType === 'image' && images.length > 0) {
             base64Source = images[0];
         } else if (inputType === 'draw' && drawingCanvasRef.current) {
             base64Source = drawingCanvasRef.current.toDataURL('image/png');
         } else if (inputType === 'attributes' && images.length > 0) {
             base64Source = images[0];
         } else if (inputType === 'edit' && images.length > 0) {
             base64Source = images[0];
             // we could also extract maskCanvas data here if api supports it
         }
         
         if (base64Source) {
             const [prefix, data] = base64Source.split(',');
             const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/png';
             parts.push({
                 inlineData: {
                     data: data,
                     mimeType: mimeType
                 }
             });
         }
         parts.push({ text: finalPrompt });
         
         const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash-image',
             contents: { parts },
             config: {
                 imageConfig: {
                     aspectRatio: aspectRatio as any
                 }
             }
         });
         
         let base64EncodeString = '';
         for (const part of response.candidates?.[0]?.content?.parts || []) {
             if (part.inlineData) {
                 base64EncodeString = part.inlineData.data;
                 break;
             }
         }
         
         if (!base64EncodeString) {
             throw new Error('No image returned from Gemini API');
         }
         imageUrl = `data:image/png;base64,${base64EncodeString}`;
      } else {
         const headers: Record<string, string> = {
             'Content-Type': 'application/json'
         };
         if (apiKey) {
             headers['Authorization'] = `Bearer ${apiKey}`;
             headers['x-goog-api-key'] = apiKey; // fallback
         }

         let actualEndpoint = apiUrl;
         let isChatCompletion = true;

         try {
             const infoRes = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
             if (infoRes.ok) {
                 const infoData = await infoRes.json();
                 if (infoData && Array.isArray(infoData.endpoints)) {
                     const imgEp = infoData.endpoints.find((e: string) => e.includes('/images/generations'));
                     const chatEp = infoData.endpoints.find((e: string) => e.includes('/chat/completions'));
                     const compEp = infoData.endpoints.find((e: string) => e.includes('POST') && e.includes('/completions') && !e.includes('/chat/'));
                     
                     let selectedPath = '';
                     if (imgEp) { selectedPath = imgEp.split(' ')[1]; isChatCompletion = false; }
                     else if (chatEp) { selectedPath = chatEp.split(' ')[1]; isChatCompletion = true; }
                     else if (compEp) { selectedPath = compEp.split(' ')[1]; isChatCompletion = false; }

                     if (selectedPath) {
                         const urlObj = new URL(apiUrl);
                         urlObj.pathname = selectedPath;
                         actualEndpoint = urlObj.toString();
                     }
                 }
             }
         } catch (e) {
             console.warn("Could not fetch endpoints info, falling back to heuristic", e);
         }

         if (actualEndpoint === apiUrl) {
             if (apiUrl.endsWith('/v1') || apiUrl.endsWith('/v1/')) {
                 actualEndpoint = apiUrl.replace(/\/$/, '') + '/chat/completions';
             }
             isChatCompletion = actualEndpoint.includes('/chat/completions');
         }

         let body: any = {};
         if (isChatCompletion) {
             body = {
                 model: modelName || 'gemini-2.5-flash',
                 messages: [
                     {
                         role: 'user',
                         content: finalPrompt
                     }
                 ]
             };
             if (inputType === 'image' && images.length > 0) {
                 body.messages[0].content = [
                     { type: 'text', text: finalPrompt },
                     { type: 'image_url', image_url: { url: images[0] } }
                 ];
             } else if (inputType === 'draw' && drawingCanvasRef.current) {
                 body.messages[0].content = [
                     { type: 'text', text: finalPrompt },
                     { type: 'image_url', image_url: { url: drawingCanvasRef.current.toDataURL('image/png') } }
                 ];
             } else if ((inputType === 'attributes' || inputType === 'edit') && images.length > 0) {
                 body.messages[0].content = [
                     { type: 'text', text: finalPrompt },
                     { type: 'image_url', image_url: { url: images[0] } }
                 ];
             }
         } else {
             body = {
                 model: modelName || 'dall-e-3',
                 prompt: finalPrompt,
                 n: 1,
                 size: imageSize
             };
             if (inputType === 'image' && images.length > 0) {
                 body.image = images[0];
             } else if (inputType === 'draw' && drawingCanvasRef.current) {
                 body.image = drawingCanvasRef.current.toDataURL('image/png');
             } else if ((inputType === 'attributes' || inputType === 'edit') && images.length > 0) {
                 body.image = images[0];
             }
         }

         const res = await fetch(actualEndpoint, {
             method: 'POST',
             headers,
             body: JSON.stringify(body)
         });
         
         if (!res.ok) throw new Error(`API Error: ${res.status}`);
         const data = await res.json();
         
         let extractedUrl = '';
         const content = data?.choices?.[0]?.message?.content;
         if (content) {
             const mdMatch = content.match(/!\[.*?\]\((.*?)\)/);
             const urlMatch = content.match(/https?:\/\/[^\s)]+/);
             if (mdMatch) {
                 extractedUrl = mdMatch[1];
             } else if (content.startsWith('data:image')) {
                 extractedUrl = content;
             } else if (urlMatch) {
                 extractedUrl = urlMatch[0];
             } else {
                 extractedUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(content.slice(0, 500))}?nologo=true&width=${width}&height=${height}`;
             }
         }
         
         imageUrl = extractedUrl || data?.data?.[0]?.url || data?.predictions?.[0]?.bytesBase64Encoded || data?.url || data?.image || `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt || 'Random aesthetic')}?nologo=true&width=${width}&height=${height}`;
         if (data?.predictions?.[0]?.bytesBase64Encoded && !imageUrl.startsWith('data:')) {
             imageUrl = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
         }
      }
      
      let finalImageUrl = imageUrl;
      
      if (enableUpload) {
          try {
              const res = await fetch('/api/upload', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      base64: imageUrl,
                      filename: `generated-${Date.now()}.png`
                  })
              });
              const data = await res.json();
              if (res.ok && data.url) {
                  finalImageUrl = data.url;
              } else {
                  console.warn('Upload failed:', data.error);
              }
          } catch (err) {
              console.warn('Upload failed:', err);
          }
      }

      const originalImage = (inputType === 'edit' && images.length > 0) ? images[0] : undefined;
      onGenerateSuccess(finalImageUrl, basePrompt || 'Generated Image', fullInstruction, originalImage);
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
        fullPrompt: pendingImage.fullPrompt,
        x: randomX,
        y: randomY,
        rotation: randomRot,
        originalImage: pendingImage.originalImage
      };

      setGalleryItems([...galleryItems, newItem]);
      clearPending();
    }
  };

  return (
    <div className={`w-full h-full flex flex-col flex-1 lg:flex-row gap-4 lg:gap-6 ${isDark ? 'text-white' : 'text-black'}`}>
      {/* LEFT PANEL */}
      <div className={`w-full lg:w-[450px] border-4 shadow-[4px_4px_0_0_#000] lg:shadow-[8px_8px_0_0_#000] flex flex-col rounded-2xl overflow-hidden shrink-0 flex-none lg:h-full ${isDark ? 'bg-zinc-800 border-gray-600' : 'bg-white border-black'}`}>
        <div className={`border-b-4 p-4 lg:p-5 flex justify-between items-center backdrop-blur-sm ${isDark ? 'border-gray-600 bg-zinc-900/60' : 'border-black bg-white/60'}`}>
          <span className="text-lg lg:text-xl font-black uppercase tracking-tight">{t.input}</span>
          <select 
            value={inputType} 
            onChange={(e) => setInputType(e.target.value as any)}
            className={`border-4 p-1.5 lg:p-2 text-xs lg:text-sm font-bold rounded-xl backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-[#FFCC00] cursor-pointer shadow-[2px_2px_0_0_#000] lg:shadow-[4px_4px_0_0_#000] ${isDark ? 'bg-zinc-800/80 text-white border-gray-600' : 'bg-white/80 text-black border-black'}`}
          >
            <option value="text">{t.textToImage}</option>
            <option value="image">{t.imageToImage}</option>
            <option value="draw">{t.drawToImage}</option>
            <option value="attributes">{t.attributesMode}</option>
            <option value="edit">{t.editToImage}</option>
            <option value="template">{t.templateMode}</option>
          </select>
        </div>

        <div className={`p-6 flex flex-col gap-6 flex-1 overflow-y-auto backdrop-blur-md ${isDark ? 'bg-zinc-800/40' : 'bg-white/40'}`}>
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

            {inputType === 'edit' && (
              <div className="flex flex-col gap-4">
                {images.length === 0 ? (
                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest mb-3">
                      {t.baseImages}
                    </label>
                    <ImageUploader images={images} setImages={setImages} />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-black uppercase tracking-widest">
                        {t.drawMask}
                      </label>
                      <button 
                        onClick={() => setImages([])} 
                        className="text-xs font-bold underline"
                      >
                        Change Image
                      </button>
                    </div>
                    <MaskCanvas canvasRef={maskCanvasRef} backgroundImage={images[0]} />
                  </div>
                )}
              </div>
            )}

            {inputType === 'attributes' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest mb-3">
                    {t.baseImages} <span className="opacity-50 tracking-normal ml-1 text-xs">({t.optional})</span>
                  </label>
                  <ImageUploader images={images} setImages={setImages} />
                </div>
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest mb-3">
                    {t.attributesMode}
                  </label>
                  <div className="flex flex-col gap-3">
                    {attributesList.map((attr, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          type="text" 
                          value={attr.name} 
                          onChange={e => {
                            const newAttrs = [...attributesList];
                            newAttrs[index].name = e.target.value;
                            setAttributesList(newAttrs);
                          }} 
                          className={`flex-1 p-3 backdrop-blur-sm border-4 rounded-xl font-bold text-sm focus:ring-4 focus:ring-[#FFCC00] outline-none transition-all shadow-[2px_2px_0_0_#000] ${isDark ? 'bg-zinc-700/80 border-gray-600 text-white placeholder-gray-400' : 'bg-white/80 border-black text-black placeholder-gray-500'}`}
                          placeholder={lang === 'en' ? 'e.g. Subject' : '例如：主體'}
                        />
                        <input 
                          type="text" 
                          value={attr.value} 
                          onChange={e => {
                            const newAttrs = [...attributesList];
                            newAttrs[index].value = e.target.value;
                            setAttributesList(newAttrs);
                          }} 
                          className={`flex-[2] p-3 backdrop-blur-sm border-4 rounded-xl font-bold text-sm focus:ring-4 focus:ring-[#FFCC00] outline-none transition-all shadow-[2px_2px_0_0_#000] ${isDark ? 'bg-zinc-700/80 border-gray-600 text-white placeholder-gray-400' : 'bg-white/80 border-black text-black placeholder-gray-500'}`}
                          placeholder={lang === 'en' ? 'e.g. A cute dog' : '例如：一隻可愛的狗'}
                        />
                        <button 
                          onClick={() => setAttributesList(attributesList.filter((_, i) => i !== index))} 
                          className={`p-3 border-4 rounded-xl transition-colors shadow-[2px_2px_0_0_#000] flex items-center ${isDark ? 'border-gray-600 hover:bg-red-500/80 bg-zinc-700' : 'border-black hover:bg-red-400 bg-white'}`}
                        >
                          <Trash2 className="w-5 h-5"/>
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setAttributesList([...attributesList, {name: '', value: ''}])} 
                      className={`w-full py-3 border-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors shadow-[4px_4px_0_0_#000] mt-1 ${isDark ? 'border-gray-600 hover:bg-zinc-700 bg-zinc-800' : 'border-black hover:bg-gray-100 bg-white'}`}
                    >
                      + {t.addAttribute}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {inputType === 'template' && (
              <div className="flex flex-col gap-4">
                <label className="block text-sm font-black uppercase tracking-widest">Select Template</label>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto p-1">
                   {templates.map(t => (
                      <div key={t.id} onClick={() => setSelectedTemplate(t)} className={`flex flex-col cursor-pointer rounded-xl border-4 overflow-hidden relative transition-all shadow-[4px_4px_0_0_#000] hover:scale-105 active:scale-95 ${selectedTemplate?.id === t.id ? 'border-[#FFCC00] ring-4 ring-[#FFCC00]/50' : (isDark ? 'border-gray-600' : 'border-black')}`}>
                         {t.image_url ? (
                            <img src={t.image_url} alt={t.title} className="w-full h-24 object-cover border-b-4 border-inherit" />
                         ) : (
                            <div className="w-full h-24 flex items-center justify-center bg-gray-200 border-b-4 border-inherit text-xs text-gray-500 font-bold uppercase">No Image</div>
                         )}
                         <div className={`p-2 font-black text-xs uppercase truncate ${isDark ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`}>{t.title}</div>
                      </div>
                   ))}
                   {templates.length === 0 && <div className="col-span-2 text-center text-sm font-bold opacity-50 py-4">No templates found. Tell an admin to add some!</div>}
                </div>
                
                <label className="block text-sm font-black uppercase tracking-widest mt-2">{t.prompt} <span className="opacity-50 tracking-normal ml-1 text-xs">({t.optional})</span></label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Additional details to add to the template..."
                  className={`w-full h-20 p-4 backdrop-blur-sm border-4 rounded-xl font-bold text-sm focus:ring-4 focus:ring-[#FFCC00] outline-none transition-all resize-none shadow-[4px_4px_0_0_#000] ${isDark ? 'bg-zinc-700/80 border-gray-600 text-white placeholder-gray-400' : 'bg-white/80 border-black text-black placeholder-gray-500'}`}
                />
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  {t.style}
                </label>
                <select 
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  className={`w-full border-4 p-2 text-sm font-bold rounded-xl backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-[#FFCC00] cursor-pointer shadow-[4px_4px_0_0_#000] ${isDark ? 'bg-zinc-800/80 border-gray-600 text-white' : 'bg-white/80 border-black text-black'}`}
                >
                  <option value="none">{t.none}</option>
                  <option value="anime">{t.anime}</option>
                  <option value="photorealistic">{t.photorealistic}</option>
                  <option value="digital art">{t.digitalArt}</option>
                  <option value="3d render">{t.threeDRender}</option>
                  <option value="sketch">{t.sketch}</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  {t.size}
                </label>
                <select 
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className={`w-full border-4 p-2 text-sm font-bold rounded-xl backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-[#FFCC00] cursor-pointer shadow-[4px_4px_0_0_#000] ${isDark ? 'bg-zinc-800/80 border-gray-600 text-white' : 'bg-white/80 border-black text-black'}`}
                >
                  <option value="1024x1024">1:1</option>
                  <option value="1024x576">16:9</option>
                  <option value="576x1024">9:16</option>
                </select>
              </div>
            </div>

            {inputType !== 'attributes' && inputType !== 'template' && (
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-3">
                  {t.prompt}
                </label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.placeholder}
                  className={`w-full h-32 p-4 backdrop-blur-sm border-4 rounded-xl font-bold text-sm focus:ring-4 focus:ring-[#FFCC00] outline-none transition-all resize-none shadow-[4px_4px_0_0_#000] ${isDark ? 'bg-zinc-700/80 border-gray-600 text-white placeholder-gray-400' : 'bg-white/80 border-black text-black placeholder-gray-500'}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-6 flex gap-4 border-t-4 backdrop-blur-sm mt-auto ${isDark ? 'border-gray-600 bg-zinc-900/60' : 'border-black bg-white/60'}`}>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || (inputType === 'text' && !prompt.trim()) || (inputType === 'attributes' && !attributesList.some(a => a.name.trim() || a.value.trim()))}
            className={`flex-1 py-4 bg-[#FFCC00] text-black font-black uppercase text-lg border-4 tracking-widest transition-colors rounded-xl shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${isDark ? 'hover:bg-[#e6b800] border-gray-600' : 'hover:bg-yellow-400 border-black'}`}
          >
            {isGenerating ? <Loader2 className="animate-spin w-6 h-6" /> : t.generate}
          </button>
          <button 
            onClick={() => {
                setPrompt('');
                setImages([]);
                setAttributesList([{name: '', value: ''}]);
                if (drawingCanvasRef.current) {
                    const ctx = drawingCanvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0,0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
                    }
                }
            }}
            className={`px-5 border-4 transition-colors rounded-xl shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none ${isDark ? 'border-gray-600 hover:bg-zinc-700 bg-zinc-800 text-white' : 'border-black hover:bg-gray-200 bg-white text-black'}`}
            title="Clear all"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* RIGHT PANEL - Virtual Picture Wall and Camera */}
      <div className={`flex-1 min-h-[70vh] lg:min-h-0 border-4 shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] rounded-2xl flex flex-col relative overflow-hidden ${isDark ? 'bg-zinc-900 border-gray-700' : 'bg-[#f8f9fa] border-black'}`}
           style={{ backgroundImage: `radial-gradient(${isDark ? '#444' : '#ddd'} 2px, transparent 2px)`, backgroundSize: '30px 30px' }}>
         
         <div className="absolute inset-0 pointer-events-none z-10 p-6 opacity-30">
             <h1 className={`text-4xl font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>{t.virtualWall}</h1>
         </div>

         {wallEffect !== 'none' && <EffectsOverlay effect={wallEffect} />}

        {/* The Wall Area (Gallery) */}
        <div className="absolute inset-0 z-20">
           {galleryItems.map((item, i) => (
              <GalleryPhoto key={item.id} item={item} initialZ={i} onImageClick={(item) => { setPreviewImage(item); setShowOriginal(false); setShowFullPrompt(false); }} isDark={isDark} />
           ))}
        </div>

        {/* Bottom Section - Camera Base */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-transparent z-30 flex items-end justify-center pointer-events-none">
            
            <div className="relative flex flex-col items-center pb-8 pointer-events-auto">
              
              {/* Camera */}
              <TiltCard className="z-20 scale-75 sm:scale-90 lg:scale-100 origin-bottom">
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
                <div className={`absolute -top-32 flex flex-col items-center gap-2 p-4 rounded-xl border-4 ${isDark ? 'bg-zinc-800/80 border-gray-600 text-white' : 'bg-white/80 border-black text-black'}`}>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="font-black uppercase tracking-widest text-xs">{t.generating}</p>
                </div>
              ) : error ? (
                <div className={`absolute -top-32 font-bold p-4 text-center border-4 rounded-xl shadow-[4px_4px_0_0_#000] ${isDark ? 'bg-zinc-800 border-gray-600 text-red-400' : 'bg-white border-black text-red-500'}`}>{error}</div>
              ) : pendingImage ? (
                <DraggablePendingPhoto pendingImage={pendingImage} handleDragEnd={handleDragEnd} t={t} isDark={isDark} />
              ) : (
                <div className={`absolute -top-20 flex flex-col items-center gap-2 px-6 py-3 rounded-full border-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] ${isDark ? 'bg-zinc-800/90 border-gray-600 text-gray-300' : 'bg-white/90 border-black text-gray-500'}`}>
                  <Sparkles className="w-6 h-6" />
                  <p className="font-black uppercase tracking-widest text-[10px]">{t.waiting}</p>
                </div>
              )}

            </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-black/60 backdrop-blur-sm" onClick={() => { setPreviewImage(null); setShowOriginal(false); setShowFullPrompt(false); }}>
          <div className={`border-4 flex flex-col rounded-2xl shadow-[12px_12px_0_0_#000] max-w-4xl w-full max-h-[90vh] overflow-hidden relative ${isDark ? 'bg-zinc-800 border-gray-600 text-white' : 'bg-white border-black text-black'}`} onClick={e => e.stopPropagation()}>
            <div className={`flex flex-col p-4 border-b-4 ${isDark ? 'border-gray-600 bg-zinc-900' : 'border-black bg-[#f8f9fa]'}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  {showFullPrompt && previewImage.fullPrompt ? (
                    <pre className="font-bold text-sm whitespace-pre-wrap font-mono m-0 overflow-auto max-h-32 p-2 bg-black/5 rounded-lg">{previewImage.fullPrompt}</pre>
                  ) : (
                    <p className="font-black text-xl break-words">{previewImage.prompt}</p>
                  )}
                </div>
                <button onClick={() => { setPreviewImage(null); setShowOriginal(false); setShowFullPrompt(false); }} className={`shrink-0 p-2 border-4 rounded-xl transition-colors shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none ${isDark ? 'border-gray-600 hover:bg-zinc-700 bg-zinc-800' : 'border-black hover:bg-gray-200 bg-white'}`}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              {previewImage.fullPrompt && (
                <div className="flex items-center gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showFullPrompt} 
                      onChange={(e) => setShowFullPrompt(e.target.checked)}
                      className="w-5 h-5 accent-[#FFCC00] rounded"
                    />
                    <span className="font-bold text-sm tracking-widest uppercase">{t.showFullPrompt}</span>
                  </label>
                  <button
                    onClick={() => navigator.clipboard.writeText(previewImage.fullPrompt || '')}
                    className="flex items-center gap-1 text-sm font-bold uppercase hover:text-[#FFCC00] transition-colors"
                    title={t.copyPrompt}
                  >
                    <Copy size={16} /> {t.copyPrompt}
                  </button>
                </div>
              )}
            </div>
            <div className={`flex-1 overflow-auto p-6 flex items-center justify-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-100'}`} style={{ backgroundImage: `radial-gradient(${isDark ? '#555' : '#ddd'} 2px, transparent 2px)`, backgroundSize: '30px 30px' }}>
              {previewImage.originalImage && showOriginal ? (
                 <div className={`w-full max-w-2xl h-[60vh] border-4 rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] overflow-hidden ${isDark ? 'border-gray-600 bg-zinc-800' : 'border-black bg-white'}`}>
                   <ImageCompareSlider originalImage={previewImage.originalImage} editedImage={previewImage.url} />
                 </div>
              ) : (
                <img src={previewImage.url} alt={previewImage.prompt} className={`max-w-full max-h-[60vh] object-contain border-4 rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] ${isDark ? 'border-gray-600 bg-zinc-800' : 'border-black bg-white'}`} />
              )}
            </div>
            <div className={`p-4 border-t-4 flex items-center justify-between ${isDark ? 'border-gray-600 bg-zinc-900' : 'border-black bg-white'}`}>
              <div>
                 {previewImage.originalImage && (
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={showOriginal} 
                        onChange={(e) => setShowOriginal(e.target.checked)}
                        className="w-5 h-5 accent-[#FFCC00] rounded"
                      />
                      <span className="font-bold text-sm tracking-widest uppercase">{t.compareOriginal}</span>
                    </label>
                 )}
              </div>
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch(previewImage.url);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `generated-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch(e) {
                      const a = document.createElement('a');
                      a.target = '_blank';
                      a.href = previewImage.url;
                      a.download = `generated-${Date.now()}.png`;
                      a.click();
                  }
                }}
                className={`py-3 px-6 bg-[#FFCC00] text-black font-black uppercase text-lg border-4 tracking-widest transition-colors rounded-xl shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center gap-2 ${isDark ? 'border-gray-600 hover:bg-[#e6b800]' : 'border-black hover:bg-yellow-400'}`}
              >
                <Download className="w-5 h-5" />
                {t.download}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DraggablePendingPhoto({ pendingImage, handleDragEnd, t, isDark }: any) {
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
        <div className={`w-full p-3 shadow-2xl border-4 rounded-xl flex flex-col relative pointer-events-none select-none transform-gpu ${isDark ? 'bg-zinc-800 border-gray-600 text-white' : 'bg-white border-black text-black'}`} style={{ transformStyle: 'preserve-3d' }}>
          <div className={`absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#FFCC00] text-black px-4 py-1 border-4 rounded-full font-black text-[10px] uppercase shadow-[4px_4px_0_0_#000] z-50 animate-bounce ${isDark ? 'border-gray-600' : 'border-black'}`} style={{ transform: 'translateZ(30px)' }}>
              {t.dragUp} <ArrowUpCircle size={14} />
          </div>
          <div className={`w-full aspect-square border-4 overflow-hidden flex items-center justify-center relative rounded-md ${isDark ? 'bg-zinc-700 border-gray-600' : 'bg-gray-100 border-black'}`} style={{ transform: 'translateZ(10px)' }}>
            <img src={pendingImage.url} alt="Generated" className="w-full h-full object-cover" />
          </div>
          <div className="mt-3 flex flex-col items-center justify-center pb-2" style={{ transform: 'translateZ(20px)' }}>
            <p className="text-sm font-bold truncate px-2 w-full text-center leading-tight">
              {pendingImage.prompt || t.doodle}
            </p>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

function GalleryPhoto({ item, initialZ, onImageClick, isDark }: { key?: string; item: GalleryItem, initialZ: number, onImageClick: (item: GalleryItem) => void, isDark?: boolean }) {
  const [zIndex, setZIndex] = useState(initialZ);
  const startPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  
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
        onDragStart={() => {
            setZIndex(Date.now());
            hasDragged.current = true;
        }}
        onPointerDown={(e) => {
            startPos.current = { x: e.clientX, y: e.clientY };
            hasDragged.current = false;
        }}
        onPointerUp={(e) => {
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 5 && !hasDragged.current) {
                onImageClick(item);
            }
        }}
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
        <div className={`w-full p-3 shadow-[8px_8px_0_0_rgba(0,0,0,0.3)] border-4 flex flex-col relative rounded-xl transform-gpu ${isDark ? 'bg-zinc-800 border-gray-600' : 'bg-white border-black'}`} style={{ transformStyle: 'preserve-3d' }}>
            {/* Duct tape */}
            <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-16 h-8 border-2 rotate-[-5deg] mix-blend-multiply z-20 ${isDark ? 'bg-gray-400/90 border-gray-600' : 'bg-gray-200/90 border-black'}`} style={{ transform: 'translateZ(10px)' }}></div>

            <div className={`w-full aspect-square border-4 overflow-hidden flex items-center justify-center relative rounded-md pointer-events-none ${isDark ? 'bg-zinc-700 border-gray-600' : 'bg-gray-100 border-black'}`} style={{ transform: 'translateZ(5px)' }}>
            <img src={item.url} draggable={false} alt={item.prompt} className="w-full h-full object-cover" />
            </div>
            <div className={`mt-3 flex flex-col items-center justify-center pb-2 pointer-events-none ${isDark ? 'text-white' : 'text-black'}`} style={{ transform: 'translateZ(15px)' }}>
            <p className="text-lg font-black truncate px-2 w-full text-center leading-tight">
                {item.prompt}
            </p>
            </div>
        </div>
    </motion.div>
  );
}

