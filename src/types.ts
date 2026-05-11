export type ViewState = 'generate' | 'gallery';

export interface GalleryItem {
  id: string;
  url: string;
  prompt: string;
  x: number;
  y: number;
  rotation: number;
}
