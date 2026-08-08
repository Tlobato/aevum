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
    }
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
    }
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
    }
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
    }
  },
  "bau-terror": {
    id: "bau-terror",
    name: "Baú do Terror",
    assets: {
      vault: {
        closed: "/themes/bau-terror/bau-terror-fechado.png",
        opened: "/themes/bau-terror/bau-terror-aberto.png"
      },
      relics: {
        // Ícones serão adicionados futuramente
      }
    }
  }
};
