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
  "bau-pirata": {
    id: "bau-pirata",
    name: "Baú de Tesouro Pirata",
    assets: {
      vault: {
        closed: "/themes/bau-pirata/bau-fechado.png",
        opened: "/themes/bau-pirata/bau-aberto.png"
      },
      relics: {
        TEXT: "/themes/bau-pirata/carta.png",
        // PHOTO, AUDIO, VIDEO cairão no Fallback Seguro do CSS (PhysicalRelic)
        // até que o artista exporte e você registre o path aqui!
      }
    }
  }
};
