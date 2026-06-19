"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Type, Camera, Mic, FileVideo, Download } from "lucide-react";
import { Memory } from "@/types/capsule";
import { useTranslation } from "react-i18next";

export function RelicGallery({ memories, title }: { memories: Memory[], title: string }) {
  const { t } = useTranslation();
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [fetchedTextContent, setFetchedTextContent] = useState<string | null>(null);

  useEffect(() => {
     if (selectedMemory?.type === "TEXT" && !selectedMemory.textContent && selectedMemory.presignedGetUrl) {
         setFetchedTextContent(t("relicGallery.deciphering"));
         fetch(selectedMemory.presignedGetUrl)
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.text();
            })
            .then(text => setFetchedTextContent(text))
            .catch(() => setFetchedTextContent(t("relicGallery.readError")));
     } else {
         setFetchedTextContent(null);
     }
  }, [selectedMemory]);

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Escape" && selectedMemory) {
             setSelectedMemory(null);
         }
     };
     window.addEventListener("keydown", handleKeyDown);
     return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMemory]);

  const getIcon = (type: string) => {
    switch (type) {
      case "TEXT": return <Type className="w-5 h-5 text-neutral-400" />;
      case "PHOTO": return <Camera className="w-5 h-5 text-amber-500" />;
      case "AUDIO": return <Mic className="w-5 h-5 text-blue-400" />;
      case "VIDEO": return <FileVideo className="w-5 h-5 text-purple-400" />;
      default: return <Type className="w-5 h-5" />;
    }
  };

  const getLabel = (type: string) => {
     switch (type) {
        case "TEXT": return t("relicGallery.labels.TEXT");
        case "PHOTO": return t("relicGallery.labels.PHOTO");
        case "AUDIO": return t("relicGallery.labels.AUDIO");
        case "VIDEO": return t("relicGallery.labels.VIDEO");
        default: return t("relicGallery.labels.default");
     }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 min-h-[70vh] flex flex-col relative z-20">
      
      {/* Cabeçalho da Galeria */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-5xl font-serif text-white/90 drop-shadow-md mb-2">{title}</h2>
        <p className="text-amber-500/80 font-mono tracking-widest text-sm uppercase">{t("relicGallery.awakenedHeritage")}</p>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-6" />
      </motion.div>

      {/* Grid de Memórias */}
      {memories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
           <p className="text-neutral-500 font-serif italic text-lg">{t("relicGallery.emptyVault")}</p>
        </div>
      ) : (
        <motion.div 
          initial="hidden" animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {memories.map((mem) => (
            <motion.div
              key={mem.id}
              variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setSelectedMemory(mem)}
              className="bg-neutral-900/60 backdrop-blur-sm border border-white/5 hover:border-amber-500/30 rounded-2xl p-5 cursor-pointer transition-colors shadow-lg group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/10 group-hover:border-amber-500/50 transition-colors">
                  {getIcon(mem.type)}
                </div>
                <div className="flex flex-col">
                  <span className="text-white/90 font-bold text-sm truncate max-w-[120px]">{mem.fileName || getLabel(mem.type)}</span>
                  <span className="text-neutral-500 text-[10px] font-mono uppercase">{getLabel(mem.type)}</span>
                </div>
              </div>

              {/* Preview content if available */}
              <div className="h-24 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden relative z-10">
                 {mem.type === "TEXT" && (
                    <p className="text-neutral-400 text-xs italic px-4 text-center line-clamp-3">
                       "{mem.textContent || t("relicGallery.attachedDocument")}"
                    </p>
                 )}
                 {mem.type === "PHOTO" && mem.presignedGetUrl && (
                    <img src={mem.presignedGetUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Memory" />
                 )}
                 {(mem.type === "VIDEO" || mem.type === "AUDIO") && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                       <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white/60 border-b-[5px] border-b-transparent ml-1" />
                    </div>
                 )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Lightbox / Leitor */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
          >
            <button 
               onClick={() => setSelectedMemory(null)}
               className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-50"
            >
               <X className="w-6 h-6" />
            </button>

            <div className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center relative">
               
               {selectedMemory.type === "TEXT" && (
                  <div className="bg-neutral-900/80 border border-white/10 p-8 md:p-12 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col items-center">
                     <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                     <Type className="w-8 h-8 text-neutral-600 mb-6" />
                     <h3 className="text-xl font-serif text-white mb-6 font-bold text-center">{selectedMemory.fileName || t("relicGallery.writtenMessage")}</h3>
                     
                     {selectedMemory.textContent || fetchedTextContent ? (
                        <div className="text-neutral-300 font-serif leading-relaxed text-lg whitespace-pre-wrap max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar w-full">
                           {selectedMemory.textContent || fetchedTextContent}
                        </div>
                     ) : (
                        <div className="text-neutral-400 text-center flex flex-col items-center gap-4">
                           <p>{t("relicGallery.cannotTranscribe")}</p>
                        </div>
                     )}
                  </div>
               )}

               {selectedMemory.type === "PHOTO" && selectedMemory.presignedGetUrl && (
                  <img src={selectedMemory.presignedGetUrl} className="max-w-full max-h-[80vh] rounded-lg shadow-[0_0_50px_rgba(255,255,255,0.1)]" alt="Memory Expanded" />
               )}

               {selectedMemory.type === "VIDEO" && selectedMemory.presignedGetUrl && (
                  <video src={selectedMemory.presignedGetUrl} controls autoPlay className="max-w-full max-h-[80vh] rounded-lg shadow-[0_0_50px_rgba(255,255,255,0.1)] outline-none" />
               )}

               {selectedMemory.type === "AUDIO" && selectedMemory.presignedGetUrl && (
                  <div className="bg-neutral-900/80 border border-white/10 p-12 rounded-3xl w-full max-w-xl flex flex-col items-center shadow-2xl">
                     <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-8">
                        <Mic className="w-10 h-10 text-blue-400" />
                     </div>
                     <h3 className="text-xl font-serif text-white mb-8">{selectedMemory.fileName || t("relicGallery.voiceRecording")}</h3>
                     <audio src={selectedMemory.presignedGetUrl} controls autoPlay className="w-full" />
                  </div>
               )}

               {selectedMemory.presignedGetUrl && (
                  <button 
                     onClick={async (e) => {
                        e.preventDefault();
                        try {
                           const res = await fetch(selectedMemory.presignedGetUrl!);
                           const blob = await res.blob();
                           const url = window.URL.createObjectURL(blob);
                           const a = document.createElement('a');
                           a.style.display = 'none';
                           a.href = url;
                           a.download = selectedMemory.fileName || "reliquia_aevum";
                           document.body.appendChild(a);
                           a.click();
                           window.URL.revokeObjectURL(url);
                           document.body.removeChild(a);
                        } catch (err) {
                           console.error(t("relicGallery.downloadFail"), err);
                           window.open(selectedMemory.presignedGetUrl, "_blank");
                        }
                     }}
                     className="mt-8 px-6 py-3 bg-white/10 hover:bg-amber-600/20 border border-white/20 hover:border-amber-500/50 hover:text-amber-400 rounded-full text-white font-bold uppercase tracking-widest text-sm transition-all flex items-center gap-2"
                  >
                     <Download className="w-4 h-4" />
                     {t("relicGallery.downloadFile")}
                  </button>
               )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
