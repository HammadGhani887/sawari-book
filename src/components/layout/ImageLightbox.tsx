"use client";

import { useUIStore } from "@/lib/store/uiStore";
import { X, Download } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

export default function ImageLightbox() {
  const { previewImageUrl, setPreviewImage } = useUIStore();

  // Lock scroll
  useEffect(() => {
    if (previewImageUrl) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [previewImageUrl]);

  if (!previewImageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = previewImageUrl;
    link.download = `receipt-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 transition-all duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={() => setPreviewImage(null)}
      />

      {/* Header / Toolbar */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between mb-4">
        <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Receipt Preview</p>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Download Image"
          >
            <Download size={20} />
          </button>
          <button
            onClick={() => setPreviewImage(null)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div className="relative z-10 w-full max-w-2xl aspect-[3/4] md:aspect-auto md:max-h-[80dvh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        <Image
          src={previewImageUrl}
          alt="Preview"
          fill
          unoptimized
          className="object-contain"
        />
      </div>

      {/* Hint */}
      <p className="relative z-10 mt-6 text-white/40 text-[10px] uppercase tracking-[0.2em]">
        Tap outside to close
      </p>
    </div>
  );
}
