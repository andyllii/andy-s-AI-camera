import React from 'react';
import { ImagePlus, X } from 'lucide-react';

interface Props {
  images: string[];
  setImages: (images: string[]) => void;
}

export function ImageUploader({ images, setImages }: Props) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    const newImages: string[] = [];
    let count = 0;
    
    Array.from(files).forEach((file) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            newImages.push(ev.target.result as string);
          }
          count++;
          if (count === Array.from(files).length) {
            setImages([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        count++;
      }
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  return (
    <div className="flex flex-col gap-4">
      <div 
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className="relative w-full h-32 border-2 border-dashed border-black hover:border-blue-500 rounded-lg transition-colors flex items-center justify-center bg-gray-50 overflow-hidden group cursor-pointer"
      >
        <input 
          type="file" 
          accept="image/*"
          multiple
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-blue-500 transition-colors pointer-events-none">
          <ImagePlus size={32} />
          <p className="text-sm font-bold uppercase tracking-widest text-center px-4">
            Click or drop images here
          </p>
        </div>
      </div>
      
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {images.map((img, i) => (
            <div key={i} className="relative w-24 h-24 border-2 border-black rounded-lg overflow-hidden group">
              <img src={img} className="w-full h-full object-cover" alt="Uploaded" />
              <button 
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
