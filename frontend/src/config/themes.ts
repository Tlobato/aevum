import { ItemType } from "@/types/capsule";

export interface CapsuleTheme {
  id: string;
  name: string;
  assets: {
    vault: {
      closed: string;
      opened: string;
    };
    relics: Partial<Record<ItemType, string>>;
  };
}

// O Dicionário Central. Para expandir os gráficos da empresa no futuro, 
// basta adicionar um novo bloco abaixo. NENHUM CÓDIGO REACT PRECISA SER TOCADO!
export const THEME_REGISTRY: Record<string, CapsuleTheme> = {
  "bau-classico": {
    id: "bau-classico",
    name: "Baú Clássico",
    assets: {
      vault: {
        closed: "/themes/bau-classico/bau-classico-fechado.png",
        opened: "/themes/bau-classico/bau-classico-aberto.png"
      },
      relics: {
        TEXT: "/themes/bau-classico/icone-texto-classico.png",
        PHOTO: "/themes/bau-classico/icone-imagem-classico.png",
        AUDIO: "/themes/bau-classico/icone-audio-classico.png",
        VIDEO: "/themes/bau-classico/icone-video-classico.png"
      }
    }
  },
  "bau-maritimo": {
    id: "bau-maritimo",
    name: "Baú Marítimo",
    assets: {
      vault: {
        closed: "/themes/bau-maritimo/bau-maritimo-fechado.png",
        opened: "/themes/bau-maritimo/bau-maritimo-aberto.png"
      },
      relics: {
        // Ícones serão adicionados futuramente
      }
    }
  }
};
