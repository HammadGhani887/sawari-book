"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={[
          "relative z-10 bg-brand-surface rounded-t-2xl",
          "max-h-[90dvh] overflow-y-auto",
          "animate-in slide-in-from-bottom duration-300",
          "safe-bottom",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 1rem)" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
            <h2 className="text-base font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-elevated text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
