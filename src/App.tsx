import React, { useState } from 'react';
import { SettingsModal } from './components/SettingsModal';
import { GenerateView } from './components/GenerateView';
import { GalleryItem } from './types';
import { Settings } from 'lucide-react';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [pendingImage, setPendingImage] = useState<{url: string, prompt: string} | null>(null);
  const [lang, setLang] = useState<'en' | 'zh'>('en');

  // Settings
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-2.5-flash-image');

  const handleSettingsSave = (url: string, key: string, model: string) => {
    setApiUrl(url);
    setApiKey(key);
    setModelName(model);
    setIsSettingsOpen(false);
  };

  return (
    <div className="h-screen w-full font-sans bg-[#f9f7f2] text-black overflow-hidden flex flex-col selection:bg-[#FFCC00] selection:text-black relative z-0">
      {/* Blurred Aesthetic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-300/40 mix-blend-multiply filter blur-[100px] pointer-events-none z-[-1]"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-yellow-300/40 mix-blend-multiply filter blur-[100px] pointer-events-none z-[-1]"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-blue-300/40 mix-blend-multiply filter blur-[100px] pointer-events-none z-[-1]"></div>

      {/* Top Nav */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 pointer-events-none">
        <div className="font-black text-2xl md:text-3xl tracking-tighter uppercase border-4 border-black px-4 py-2 bg-white/80 backdrop-blur-md shadow-[6px_6px_0_0_#000] rotate-[-2deg] pointer-events-auto">
          {lang === 'en' ? 'Draw & Generate!' : '繪圖與生成！'}
        </div>
        <div className="pointer-events-auto flex gap-4">
          <button 
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="w-14 h-14 bg-white/80 backdrop-blur-md border-4 border-black shadow-[6px_6px_0_0_#000] rounded-full active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-[#FFCC00] hover:scale-110 flex items-center justify-center font-black text-lg"
          >
            {lang === 'en' ? '中' : 'EN'}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-white/80 backdrop-blur-md border-4 border-black shadow-[6px_6px_0_0_#000] rounded-full active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-[#FFCC00] hover:scale-110"
          >
            <Settings size={28} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full h-full relative flex pt-24 pb-6 px-6 gap-6">
        <GenerateView 
          apiUrl={apiUrl} 
          apiKey={apiKey} 
          modelName={modelName}
          onGenerateSuccess={(url, prompt) => setPendingImage({url, prompt})}
          pendingImage={pendingImage}
          clearPending={() => setPendingImage(null)}
          galleryItems={galleryItems}
          setGalleryItems={setGalleryItems}
          lang={lang}
        />
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          initialUrl={apiUrl} 
          initialKey={apiKey} 
          initialModel={modelName}
          onSave={handleSettingsSave} 
          onClose={() => setIsSettingsOpen(false)} 
          lang={lang}
        />
      )}
    </div>
  );
}
