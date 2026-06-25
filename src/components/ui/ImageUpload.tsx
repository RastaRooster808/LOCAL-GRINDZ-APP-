import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export async function compressImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => resolve(blob!), 'image/webp', 0.85);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface ImageUploadProps {
  bucket: string;
  path: string;
  label: string;
  currentUrl?: string | null;
  maxWidth?: number;
  maxHeight?: number;
  onUpload: (url: string) => void;
}

export function ImageUpload({ bucket, path, label, currentUrl, maxWidth = 800, maxHeight = 800, onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, maxWidth, maxHeight);
      const filePath = `${path}.webp`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, compressed, {
        contentType: 'image/webp',
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      setPreview(publicUrl);
      onUpload(publicUrl);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Check that the vendor-assets bucket exists in Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="img-upload">
      <p className="img-upload-label">{label}</p>
      {preview && <img src={preview} alt={label} className="img-upload-preview" loading="lazy" />}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
      <button
        type="button"
        className="btn-secondary"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : preview ? 'Change Photo' : 'Upload Photo'}
      </button>
    </div>
  );
}
