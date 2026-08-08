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
  ritualColors?: string[];
  glowColor?: string;
}

// O Dicionário Central. Para expandir os gráficos no futuro, 
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
    },
    ritualColors: [
      "rgba(212, 175, 55, ",
      "rgba(181, 149, 47, ",
      "rgba(245, 158, 11, ",
      "rgba(251, 191, 36, ",
      "rgba(255, 255, 255, "
    ],
    glowColor: "rgba(245, 158, 11, 0.5)"
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
    },
    ritualColors: [
      "rgba(14, 165, 233, ",
      "rgba(56, 189, 248, ",
      "rgba(20, 184, 166, ",
      "rgba(45, 212, 191, ",
      "rgba(255, 255, 255, "
    ],
    glowColor: "rgba(14, 165, 233, 0.5)"
  },
  "bau-astronauta": {
    id: "bau-astronauta",
    name: "Baú Astronauta",
    assets: {
      vault: {
        closed: "/themes/bau-astronauta/bau-astronauta-fechado.png",
        opened: "/themes/bau-astronauta/bau-astronauta-aberto.png"
      },
      relics: {
        // Ícones serão adicionados futuramente
      }
    },
    ritualColors: [
      "rgba(168, 85, 247, ",
      "rgba(236, 72, 153, ",
      "rgba(6, 182, 212, ",
      "rgba(34, 211, 238, ",
      "rgba(255, 255, 255, "
    ],
    glowColor: "rgba(168, 85, 247, 0.5)"
  },
  "bau-caveira-assombrada": {
    id: "bau-caveira-assombrada",
    name: "Baú Caveira Assombrada",
    assets: {
      vault: {
        closed: "/themes/bau-caveira-assombrada/bau-caveiraAssombrada-fechado.png",
        opened: "/themes/bau-caveira-assombrada/bau-caveiraAssombrada-aberto.png"
      },
      relics: {
        // Ícones serão adicionados futuramente
      }
    },
    ritualColors: [
      "rgba(34, 197, 94, ",
      "rgba(74, 222, 128, ",
      "rgba(168, 85, 247, ",
      "rgba(139, 92, 246, ",
      "rgba(240, 253, 244, "
    ],
    glowColor: "rgba(34, 197, 94, 0.5)"
  },
  "bau-grego": {
    id: "bau-grego",
    name: "Baú Grego",
    assets: {
      vault: {
        closed: "/themes/bau-grego/bau-grego-fechado.png",
        opened: "/themes/bau-grego/bau-grego-aberto.png"
      },
      relics: {
        // Ícones serão adicionados futuramente
      }
    },
    ritualColors: [
      "rgba(245, 245, 244, ",
      "rgba(214, 211, 209, ",
      "rgba(217, 119, 6, ",
      "rgba(251, 191, 36, ",
      "rgba(186, 230, 253, "
    ],
    glowColor: "rgba(217, 119, 6, 0.5)"
  },
  "bau-selva": {
    id: "bau-selva",
    name: "Baú Selvagem",
    assets: {
      vault: {
        closed: "/themes/bau-selva/bau-selva-fechado.png",
        opened: "/themes/bau-selva/bau-selva-aberto.png"
      },
      relics: {
        // Ícones serão adicionados futuramente
      }
    },
    ritualColors: [
      "rgba(21, 128, 61, ",
      "rgba(34, 197, 94, ",
      "rgba(133, 77, 14, ",
      "rgba(161, 98, 7, ",
      "rgba(254, 240, 138, "
    ],
    glowColor: "rgba(21, 128, 61, 0.5)"
  }
};
