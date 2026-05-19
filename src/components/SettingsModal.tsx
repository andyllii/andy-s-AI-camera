import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  initialUrl: string;
  initialKey: string;
  initialModel: string;
  initialEnableUpload: boolean;
  onSave: (url: string, key: string, model: string, enableUpload: boolean) => void;
  onClose: () => void;
  lang: 'en' | 'zh';
}

export function SettingsModal({ initialUrl, initialKey, initialModel, initialEnableUpload, onSave, onClose, lang }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [apiKey, setApiKey] = useState(initialKey);
  const [model, setModel] = useState(initialModel);
  const [enableUpload, setEnableUpload] = useState(initialEnableUpload);

  const t = {
    en: {
        settings: 'Settings',
        config: 'Configure your model and API endpoint.',
        leaveBlank: 'Leave Base URL empty to use the built-in Gemini image model from AI Studio.',
        modelName: 'Model Name',
        baseUrl: 'Base URL',
        apiKey: 'API Key',
        enableUpload: 'Enable Auto Upload to Vercel storage',
        save: 'Save Settings',
        placeholderModel: 'e.g. gemini-2.5-flash-image',
        placeholderUrl: 'https://api.yourcustomdomain.com/v1/...',
        placeholderKey: 'sk-...'
    },
    zh: {
        settings: '設定',
        config: '設定您的模型與 API 端點。',
        leaveBlank: '留空則使用 AI Studio 內建的 Gemini 圖像模型。',
        modelName: '模型名稱',
        baseUrl: 'API 網址 (Base URL)',
        apiKey: 'API 金鑰',
        enableUpload: '啟用自動上傳至雲端伺服器 (Vercel)',
        save: '儲存設定',
        placeholderModel: '例如 gemini-2.5-flash-image',
        placeholderUrl: 'https://api.yourcustomdomain.com/v1/...',
        placeholderKey: 'sk-...'
    }
  }[lang];

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-lg border-4 border-black shadow-[12px_12px_0_0_#000] relative rounded-2xl font-sans text-black">
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-[#FFCC00] border-4 border-black rounded-full p-2 hover:bg-yellow-400 hover:scale-110 shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="border-b-4 border-black p-6 bg-white/50 rounded-t-xl">
          <h2 className="text-2xl font-black uppercase tracking-tight">{t.settings}</h2>
        </div>

        <div className="p-5 md:p-8 flex flex-col gap-5 md:gap-6">
          <div className="bg-white/60 backdrop-blur-sm border-2 border-black p-3 md:p-4 text-sm font-bold rounded-xl tracking-wide shadow-[4px_4px_0_0_#000]">
            <p>{t.config}</p>
            <p className="mt-2 text-gray-600 font-medium">{t.leaveBlank}</p>
          </div>

          <div>
            <label className="block text-sm font-black uppercase tracking-widest mb-2">{t.modelName}</label>
            <input 
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t.placeholderModel}
              className="w-full px-4 py-3 text-sm font-bold border-2 border-black rounded-xl bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-[#FFCC00] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-black uppercase tracking-widest mb-2">{t.baseUrl}</label>
            <input 
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.placeholderUrl}
              className="w-full px-4 py-3 text-sm font-mono font-bold border-2 border-black rounded-xl bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-[#FFCC00] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-black uppercase tracking-widest mb-2">{t.apiKey}</label>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t.placeholderKey}
              className="w-full px-4 py-3 text-sm font-mono font-bold border-2 border-black rounded-xl bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-[#FFCC00] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 bg-white/60 p-4 border-2 border-black rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer w-full">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={enableUpload}
                  onChange={(e) => setEnableUpload(e.target.checked)}
                />
                <div className={`block w-14 h-8 rounded-full border-2 border-black transition-colors ${enableUpload ? 'bg-[#FFCC00]' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full border-2 border-black transition-transform ${enableUpload ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
              <span className="font-bold text-sm select-none">{t.enableUpload}</span>
            </label>
          </div>

          <button 
            onClick={() => onSave(url, apiKey, model, enableUpload)}
            className="w-full py-4 mt-4 bg-black text-white font-black text-lg uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-xl shadow-[6px_6px_0_0_#FFCC00] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
