export type ItemType = "TEXT" | "PHOTO" | "AUDIO" | "VIDEO";
export type SubMode = "WRITE" | "UPLOAD";

export interface Memory {
  id: string;
  type: ItemType;
  label: string;
  payload?: string | Blob | File;
  fileName?: string;
}
