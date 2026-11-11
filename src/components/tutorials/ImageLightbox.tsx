import React, { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  src: string;
  alt?: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, src, alt, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors bg-white/10 rounded-full hover:bg-white/20"
          title="关闭预览 (ESC)"
        >
          <X className="w-5 h-5" />
        </button>

        <img
          src={src}
          alt={alt || '教程图片预览'}
          className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-white/10 bg-slate-900"
        />

        {alt && (
          <p className="mt-3 text-xs text-slate-300 text-center font-medium bg-black/40 px-3 py-1 rounded-full">
            {alt}
          </p>
        )}
      </div>
    </div>
  );
};
