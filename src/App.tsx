import React, { useState } from 'react';
import { SettingsModal } from './components/SettingsModal';
import { GenerateView } from './components/GenerateView';
import { GalleryItem } from './types';
import { Settings, Moon, Sun } from 'lucide-react';
import { EffectType } from './components/EffectsOverlay';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [pendingImage, setPendingImage] = useState<{url: string, prompt: string, fullPrompt?: string, originalImage?: string} | null>(null);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [wallEffect, setWallEffect] = useState<EffectType>('none');

  // Settings
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-2.5-flash-image');
  const [enableUpload, setEnableUpload] = useState(false);

  const handleSettingsSave = (url: string, key: string, model: string, uploadEnabled: boolean) => {
    setApiUrl(url);
    setApiKey(key);
    setModelName(model);
    setEnableUpload(uploadEnabled);
    setIsSettingsOpen(false);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-[100dvh] lg:h-screen w-full font-sans overflow-x-hidden overflow-y-auto lg:overflow-hidden flex flex-col selection:bg-[#FFCC00] selection:text-black relative z-0 ${isDark ? 'bg-zinc-900 text-white' : 'bg-[#f9f7f2] text-black'}`}>
      {/* Blurred Aesthetic Background */}
      <div className={`fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] min-w-[300px] min-h-[300px] rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none z-[-1] ${isDark ? 'bg-purple-900/40' : 'bg-pink-300/40'}`}></div>
      <div className={`fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] min-w-[300px] min-h-[300px] rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none z-[-1] ${isDark ? 'bg-blue-900/40' : 'bg-yellow-300/40'}`}></div>
      <div className={`fixed bottom-[-10%] left-[20%] w-[50vw] h-[50vw] min-w-[300px] min-h-[300px] rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none z-[-1] ${isDark ? 'bg-indigo-900/40' : 'bg-blue-300/40'}`}></div>

      {/* Top Nav */}
      <nav className="absolute top-0 left-0 right-0 p-4 md:p-6 flex flex-col sm:flex-row justify-between items-center z-50 pointer-events-none gap-4">
        <div className={`font-black text-xl md:text-3xl tracking-tighter uppercase border-4 px-3 py-1 md:px-4 md:py-2 backdrop-blur-md rotate-[-2deg] pointer-events-auto ${isDark ? 'bg-zinc-800/80 border-gray-500 shadow-[4px_4px_0_0_#6b7280] md:shadow-[6px_6px_0_0_#6b7280]' : 'bg-white/80 border-black shadow-[4px_4px_0_0_#000] md:shadow-[6px_6px_0_0_#000]'}`}>
          {lang === 'en' ? 'Draw & Generate!' : '繪圖與生成！'}
        </div>
        <div className="pointer-events-auto flex gap-2 md:gap-4 relative">
          <select 
            value={wallEffect}
            onChange={(e) => setWallEffect(e.target.value as EffectType)}
            className={`cursor-pointer appearance-none md:w-auto h-10 md:h-auto px-2 md:px-4 py-2 md:py-3 backdrop-blur-md border-4 rounded-full transition-all hover:bg-[#FFCC00] hover:text-black hover:scale-110 font-black text-sm md:text-lg flex items-center justify-center outline-none ${isDark ? 'bg-zinc-800/80 border-gray-500 shadow-[4px_4px_0_0_#6b7280] md:shadow-[6px_6px_0_0_#6b7280]' : 'bg-white/80 border-black shadow-[4px_4px_0_0_#000] md:shadow-[6px_6px_0_0_#000]'}`}
            title="Interactive Effects"
          >
            <option value="none">✨ None</option>
            <option value="snow">❄️ Snow</option>
            <option value="rain">🌧️ Rain</option>
            <option value="sparkle">✨ Sparkle</option>
          </select>
          <button 
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className={`w-10 h-10 md:w-14 md:h-14 backdrop-blur-md border-4 rounded-full active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-[#FFCC00] hover:text-black hover:scale-110 flex items-center justify-center font-black text-sm md:text-lg ${isDark ? 'bg-zinc-800/80 border-gray-500 shadow-[4px_4px_0_0_#6b7280] md:shadow-[6px_6px_0_0_#6b7280]' : 'bg-white/80 border-black shadow-[4px_4px_0_0_#000] md:shadow-[6px_6px_0_0_#000]'}`}
          >
            {lang === 'en' ? '中' : 'EN'}
          </button>
          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`w-10 h-10 md:w-auto md:h-auto p-2 md:p-3 backdrop-blur-md border-4 rounded-full active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-[#FFCC00] hover:text-black hover:scale-110 flex items-center justify-center ${isDark ? 'bg-zinc-800/80 border-gray-500 shadow-[4px_4px_0_0_#6b7280] md:shadow-[6px_6px_0_0_#6b7280]' : 'bg-white/80 border-black shadow-[4px_4px_0_0_#000] md:shadow-[6px_6px_0_0_#000]'}`}
          >
            {isDark ? <Sun className="w-5 h-5 md:w-7 md:h-7" /> : <Moon className="w-5 h-5 md:w-7 md:h-7" />}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`w-10 h-10 md:w-auto md:h-auto p-2 md:p-3 backdrop-blur-md border-4 rounded-full active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-[#FFCC00] hover:text-black hover:scale-110 flex items-center justify-center ${isDark ? 'bg-zinc-800/80 border-gray-500 shadow-[4px_4px_0_0_#6b7280] md:shadow-[6px_6px_0_0_#6b7280]' : 'bg-white/80 border-black shadow-[4px_4px_0_0_#000] md:shadow-[6px_6px_0_0_#000]'}`}
          >
            <Settings className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full h-auto lg:h-full relative flex flex-col lg:flex-row pt-32 pb-4 px-4 md:pt-28 md:pb-6 md:px-6 gap-4 md:gap-6">
        <GenerateView 
          apiUrl={apiUrl} 
          apiKey={apiKey} 
          modelName={modelName}
          enableUpload={enableUpload}
          onGenerateSuccess={(url, prompt, fullPrompt, originalImage) => setPendingImage({url, prompt, fullPrompt, originalImage})}
          pendingImage={pendingImage}
          clearPending={() => setPendingImage(null)}
          galleryItems={galleryItems}
          setGalleryItems={setGalleryItems}
          lang={lang}
          theme={theme}
          wallEffect={wallEffect}
        />
      </main>

      <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
        <div className={`font-black text-xs md:text-sm tracking-widest px-4 py-2 border-4 rounded-full backdrop-blur-md transition-transform duration-300 hover:scale-110 cursor-default ${isDark ? 'bg-zinc-800/80 border-gray-500 shadow-[4px_4px_0_0_#6b7280]' : 'bg-white/80 border-black shadow-[4px_4px_0_0_#000]'}`}>
          Made with ❤️ By Andy LI
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          initialUrl={apiUrl} 
          initialKey={apiKey} 
          initialModel={modelName}
          initialEnableUpload={enableUpload}
          onSave={handleSettingsSave} 
          onClose={() => setIsSettingsOpen(false)} 
          lang={lang}
        />
      )}
    </div>
  );
}
