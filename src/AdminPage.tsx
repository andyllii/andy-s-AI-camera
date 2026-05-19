import React, { useState, useEffect } from 'react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTemplates();
    }
  }, [isAuthenticated]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplates(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'andyli217') {
      setIsAuthenticated(true);
    } else {
      alert("Invalid password");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setUploadedBase64(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let image_url = '';
    // upload image first if exists
    if (uploadedBase64) {
      try {
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: uploadedBase64,
            filename: uploadedFileName || `template-${Date.now()}.png`
          })
        });
        const upData = await upRes.json();
        if (upRes.ok && upData.url) {
          image_url = upData.url;
        } else {
          alert("Image upload failed: " + (upData.error || 'Unknown error'));
          setIsSubmitting(false);
          return;
        }
      } catch (err: any) {
        alert("Image upload error: " + err.message);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, prompt, image_url
        })
      });
      if (res.ok) {
        // clear form
        setTitle('');
        setDescription('');
        setPrompt('');
        setUploadedBase64(null);
        setUploadedFileName('');
        fetchTemplates();
      } else {
        const error = await res.json();
        alert("Failed to create template: " + error.error);
      }
    } catch (err: any) {
      alert("Failed to create template: " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f9f7f2] flex items-center justify-center p-4 selection:bg-[#FFCC00] selection:text-black">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0_0_#000] w-full max-w-sm">
          <h1 className="text-3xl font-black uppercase mb-6 text-center tracking-tighter">Admin Login</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="px-4 py-3 border-4 border-black rounded-xl font-bold bg-[#f9f7f2] focus:outline-none focus:bg-[#FFCC00] transition-colors"
            />
            <button type="submit" className="w-full py-4 bg-black text-white font-black text-lg uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-xl shadow-[4px_4px_0_0_#FFCC00] active:translate-x-1 active:translate-y-1 active:shadow-none">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f2] p-8 selection:bg-[#FFCC00] selection:text-black font-sans text-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-black uppercase tracking-tighter mb-8 bg-white/80 backdrop-blur-md border-4 border-black shadow-[6px_6px_0_0_#000] inline-block px-6 py-3 rounded-2xl rotate-[-2deg]">
          Manage Templates
        </h1>

        <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] rounded-2xl p-6 md:p-8 mb-12">
          <h2 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-4">Create New Template</h2>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="font-bold text-lg">Title <span className="text-red-500">*</span></label>
              <input required value={title} onChange={(e)=>setTitle(e.target.value)} type="text" className="px-4 py-3 border-4 border-black rounded-xl font-bold bg-[#f9f7f2] focus:outline-none focus:bg-[#FFCC00] transition-colors" placeholder="e.g. Cyberpunk Cityscapes" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-bold text-lg">Description</label>
              <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="px-4 py-3 border-4 border-black rounded-xl font-bold bg-[#f9f7f2] focus:outline-none focus:bg-[#FFCC00] transition-colors h-24 resize-none" placeholder="Brief description of when to use this template..." />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-lg">Prompt <span className="text-red-500">*</span></label>
              <textarea required value={prompt} onChange={(e)=>setPrompt(e.target.value)} className="px-4 py-3 border-4 border-black rounded-xl font-bold bg-[#f9f7f2] focus:outline-none focus:bg-[#FFCC00] transition-colors h-32 resize-none" placeholder="The exact prompt string to be used when generating..." />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-lg">Sample Image</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm font-bold file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-4 file:border-black file:text-sm file:font-black file:bg-[#FFCC00] file:text-black hover:file:bg-black hover:file:text-white cursor-pointer transition-colors" />
              {uploadedBase64 && (
                <div className="mt-4 border-4 border-black rounded-xl overflow-hidden shadow-[4px_4px_0_0_#000] w-fit">
                   <img src={uploadedBase64} alt="Sample preview" className="max-h-64 object-cover" />
                </div>
              )}
            </div>

            <button disabled={isSubmitting} type="submit" className="mt-4 py-4 bg-black text-white font-black text-lg uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors rounded-xl shadow-[6px_6px_0_0_#FFCC00] active:translate-x-1 active:translate-y-1 active:shadow-none">
              {isSubmitting ? 'Saving...' : 'Save Template'}
            </button>
          </form>
        </div>

        <div>
           <h2 className="text-3xl font-black uppercase mb-6 tracking-tighter">Existing Templates</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(t => (
                <div key={t.id} className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] rounded-xl flex flex-col relative overflow-hidden group">
                  {t.image_url ? (
                    <div className="h-48 border-b-4 border-black w-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                      <img src={t.image_url} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-48 border-b-4 border-black w-full bg-gray-100 flex items-center justify-center">
                       <span className="font-bold text-gray-400">No Sample Image</span>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                     <h3 className="text-xl font-black uppercase mb-2">{t.title}</h3>
                     <p className="text-sm font-bold text-gray-600 mb-2 line-clamp-2">{t.description}</p>
                     <div className="mt-auto pt-4 flex gap-2">
                        <button onClick={() => handleDelete(t.id)} className="w-full py-2 bg-red-500 text-white font-black text-sm uppercase rounded shadow-[3px_3px_0_0_#000] border-2 border-black active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                          Delete
                        </button>
                     </div>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                 <div className="col-span-full py-12 text-center font-bold text-gray-500 border-4 border-dashed border-gray-400 rounded-xl">
                    No templates yet. Create one above!
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
