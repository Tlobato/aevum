/**
 * URL base da API do Aevum.
 * Em desenvolvimento: http://localhost:8080
 * Em produção: configurar NEXT_PUBLIC_API_URL no painel da Vercel
 */
import i18n from "@/config/i18n";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const getApiHeaders = (token?: string | null) => {
    const headers: Record<string, string> = {
        "Accept-Language": i18n.language || "pt-BR",
        "Content-Type": "application/json"
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};
