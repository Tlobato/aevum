"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Trash2, Eye, Camera, Type, Mic, FileVideo, Loader2, FileText } from "lucide-react";
import { Memory } from "@/types/capsule";
import { useTranslation } from "react-i18next";
import { useSound } from "@/hooks/useSound";

interface ChestInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  isLoading: boolean;
  onDeleteMemory: (id: string, sizeBytes: number) => Promise<void>;
  deletingId: string | null;
}

export function ChestInventoryModal({
  isOpen,
  onClose,
  memories,
  isLoading,
  onDeleteMemory,
  deletingId
}: ChestInventoryModalProps) {
  const { t } = useTranslation();
  const { play } = useSound();
  const [previewMemory, setPreviewMemory] = useState<Memory | null>(null);

  if (!isOpen) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "TEXT": return <FileText className="w-5 h-5 text-amber-300" />;
      case "PHOTO": return <Camera className="w-5 h-5 text-amber-400" />;
      case "AUDIO": return <Mic className="w-5 h-5 text-amber-500" />;
      case "VIDEO": return <FileVideo className="w-5 h-5 text-amber-600" />;
      default: return <Package className="w-5 h-5 text-amber-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "TEXT": return t("vault.write");
      case "PHOTO": return t("vault.photo");
      case "AUDIO": return t("vault.audio");
      case "VIDEO": return t("vault.video");
      default: return t("vault.memory");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-neutral-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.15)] flex flex-col max-h-[85vh] relative overflow-hidden"
      >
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-neutral-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-light text-white tracking-tight flex items-center gap-2">
                <span>{t("vault.chestInventoryTitle")}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                  {memories.length}
                </span>
              </h2>
              <p className="text-xs text-neutral-400 font-light mt-0.5">
                {t("vault.chestInventorySubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { play("click"); onClose(); }}
            className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo da Lista */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 relative z-10 pr-1 custom-scrollbar">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs tracking-wider uppercase">{t("vault.connectingCentral")}</span>
            </div>
          ) : memories.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 text-sm font-light">
              {t("vault.emptyChest")}
            </div>
          ) : (
            memories.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-amber-500/30 transition-all gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {item.type === "PHOTO" && item.presignedGetUrl ? (
                      <img src={item.presignedGetUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      getIcon(item.type)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-500/90 uppercase tracking-wider">
                        {getTypeLabel(item.type)}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {formatSize(item.sizeBytes)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-200 truncate font-light mt-0.5">
                      {item.type === "TEXT"
                        ? (item.textContent || t("vault.write"))
                        : (item.fileName || t("vault.memory"))}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => { play("click"); setPreviewMemory(item); }}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                    title={t("vault.viewItem")}
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">{t("vault.viewItem")}</span>
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => onDeleteMemory(item.id, item.sizeBytes || 0)}
                    className="p-2 rounded-xl bg-red-950/30 border border-red-900/40 hover:bg-red-900/50 text-red-400 hover:text-red-200 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"
                    title={t("vault.removeItem")}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{t("vault.removeItem")}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex justify-end relative z-10">
          <button
            type="button"
            onClick={() => { play("click"); onClose(); }}
            className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all border border-neutral-700 cursor-pointer"
          >
            {t("forge.buttonCancel")}
          </button>
        </div>

        {/* Modal de Prévia Interno */}
        <AnimatePresence>
          {previewMemory && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl bg-neutral-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[80vh] overflow-hidden"
              >
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    {getIcon(previewMemory.type)}
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      {previewMemory.fileName || getTypeLabel(previewMemory.type)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { play("click"); setPreviewMemory(null); }}
                    className="p-1.5 rounded-full bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="py-6 flex-1 overflow-y-auto flex items-center justify-center">
                  {previewMemory.type === "PHOTO" && previewMemory.presignedGetUrl && (
                    <img
                      src={previewMemory.presignedGetUrl}
                      alt="Preview"
                      className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-lg"
                    />
                  )}

                  {previewMemory.type === "TEXT" && (
                    <div className="w-full p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-neutral-200 text-sm whitespace-pre-wrap leading-relaxed font-serif">
                      {previewMemory.textContent || t("vault.emptyChest")}
                    </div>
                  )}

                  {previewMemory.type === "AUDIO" && previewMemory.presignedGetUrl && (
                    <audio controls className="w-full" src={previewMemory.presignedGetUrl} />
                  )}

                  {previewMemory.type === "VIDEO" && previewMemory.presignedGetUrl && (
                    <video controls className="max-h-[60vh] max-w-full rounded-2xl" src={previewMemory.presignedGetUrl} />
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
