import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para o Dockerfile de produção (gera bundle mínimo autocontido)
  output: "standalone",
};

export default nextConfig;
