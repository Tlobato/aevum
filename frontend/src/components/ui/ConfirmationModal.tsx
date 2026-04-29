"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDangerous = false
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            {/* Glow decorativo */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${isDangerous ? 'bg-red-500' : 'bg-amber-500'}`} />

            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${isDangerous ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                <AlertTriangle className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-light text-white mb-3 tracking-tight">{title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-medium hover:bg-neutral-800 hover:text-white transition-all text-sm uppercase tracking-widest"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${
                    isDangerous 
                    ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white' 
                    : 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>

            {/* Botão fechar (X) */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
