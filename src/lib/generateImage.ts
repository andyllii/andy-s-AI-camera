export async function generateImage(params: {
  apiUrl: string;
  apiKey: string;
  modelName: string;
  prompt: string;
  baseImages?: string[];
  imageSize?: string;
  imageStyle?: string;
}) {
  const { apiUrl, apiKey, modelName, prompt, baseImages = [], imageSize = '1024x1024', imageStyle = 'none' } = params;
  
  let finalPrompt = prompt || 'Random aesthetic image';
  if (imageStyle !== 'none') {
      finalPrompt += `, in ${imageStyle} style`;
  }
  const [width, height] = imageSize.split('x');

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
     if (baseImages.length > 0) {
         const [prefix, data] = baseImages[0].split(',');
         const mimeType = prefix.match(/:(.*?);/)?.[1] || 'image/png';
         parts.push({ inlineData: { data, mimeType } });
     }
     parts.push({ text: finalPrompt });
     
     const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash-image',
         contents: { parts },
         config: {
             imageConfig: {
                 aspectRatio: aspectRatio as any,
                 numberOfImages: 1
             } as any
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
     return `data:image/png;base64,${base64EncodeString}`;
  } else {
     const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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
         // ignore
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
             messages: [ { role: 'user', content: finalPrompt } ]
         };
         if (baseImages.length > 0) {
             body.messages[0].content = [
                 { type: 'text', text: finalPrompt },
                 { type: 'image_url', image_url: { url: baseImages[0] } }
             ];
         }
     } else {
         body = {
             model: modelName || 'dall-e-3',
             prompt: finalPrompt,
             n: 1,
             size: imageSize
         };
         if (baseImages.length > 0) {
             body.image = baseImages[0];
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
         if (mdMatch) extractedUrl = mdMatch[1];
         else if (content.startsWith('data:image')) extractedUrl = content;
         else if (urlMatch) extractedUrl = urlMatch[0];
         else extractedUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(content.slice(0, 500))}?nologo=true&width=${width}&height=${height}`;
     }
     
     let imageUrl = extractedUrl || data?.data?.[0]?.url || data?.predictions?.[0]?.bytesBase64Encoded || data?.url || data?.image || `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt || 'Random aesthetic')}?nologo=true&width=${width}&height=${height}`;
     if (data?.predictions?.[0]?.bytesBase64Encoded && !imageUrl.startsWith('data:')) {
         imageUrl = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
     }
     return imageUrl;
  }
}
