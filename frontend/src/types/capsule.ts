export type ItemType = "TEXT" | "PHOTO" | "AUDIO" | "VIDEO";
export type SubMode = "WRITE" | "UPLOAD";

export interface Memory {
  id: string;
  type: ItemType;
  label: string;
  payload?: string | Blob | File; // Para criação (upload local)
  fileName?: string;
  textContent?: string;         // Para exibição da galeria
  sizeBytes?: number;           // Para exibição da galeria
  presignedGetUrl?: string;     // Para carregamento de mídias privadas da galeria
}
