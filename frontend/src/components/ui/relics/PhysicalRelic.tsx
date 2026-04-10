"use client";

import { ItemType } from "@/types/capsule";
import { CapsuleTheme } from "@/config/themes";

export function PhysicalRelic({ type, theme }: { type: ItemType; theme: CapsuleTheme }) {
  
  // 1. O Sistema Injeta dinamicamente a Skin se ela existir no Dicionário!
  const customAssetUrl = theme.assets.relics[type];
  
  if (customAssetUrl) {
    return (
       <img 
         src={customAssetUrl} 
         alt={`Relíquia de ${type}`} 
         className="w-[90px] h-[100px] mx-auto object-contain drop-shadow-2xl filter hover:brightness-110 transition-all" 
       />
    );
  }

  // 2. Se a empresa não criou a Skin deste componente ainda, ele aciona o Fallback de CSS Autêntico:
  if (type === "TEXT") {
    return (
      <div className="w-[80px] h-[100px] mx-auto bg-[#ebd5b3] rounded-sm shadow-xl relative flex items-center justify-center border-l-4 border-r-4 border-[#d4b886] drop-shadow-2xl">
        <div className="absolute top-3 left-2 right-2 space-y-1 opacity-20">
          <div className="w-full h-1 bg-black rounded" />
          <div className="w-5/6 h-1 bg-black rounded" />
          <div className="w-full h-1 bg-black rounded" />
        </div>
        <div className="w-8 h-8 bg-red-700/90 rounded-full shadow-inner flex items-center justify-center border-2 border-red-900/40">
           <div className="w-5 h-5 border border-red-900/20 rounded-full" />
        </div>
      </div>
    );
  }
  if (type === "PHOTO") {
    return (
      <div className="w-[90px] h-[110px] mx-auto bg-[#f8f8f8] p-1.5 pb-4 shadow-xl border border-white/50 rounded-sm flex items-start justify-center drop-shadow-2xl">
        <div className="w-full h-[70%] bg-gradient-to-br from-gray-800 to-black shadow-inner relative overflow-hidden">
           <div className="absolute -top-4 -right-4 w-12 h-20 bg-white/20 rotate-45 blur-sm" />
        </div>
      </div>
    );
  }
  if (type === "AUDIO") {
    return (
      <div className="w-[110px] h-[70px] mx-auto bg-gray-400 rounded-md shadow-lg p-1 relative border-t-2 border-white/40 flex items-center justify-center drop-shadow-2xl">
        <div className="w-[80%] h-[60%] bg-gray-800/80 rounded-sm flex items-center justify-between px-2">
           <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full"/></div>
           <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full"/></div>
        </div>
      </div>
    );
  }
  if (type === "VIDEO") {
    return (
      <div className="w-[100px] h-[80px] mx-auto bg-slate-900 rounded-sm shadow-xl flex flex-col relative border border-white/10 drop-shadow-2xl">
        <div className="h-4 w-full flex">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-white' : 'bg-black'} skew-x-[-15deg] scale-110`} />
          ))}
        </div>
        <div className="flex-1 w-full border-t border-white/20" />
      </div>
    );
  }
  return null;
}
