import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],

  /* Export estático: o site não tem nada de servidor — nenhum server action,
     nenhuma API route, nenhum ISR. O `out/` é o artefato que o Cloudflare
     Pages publica. */
  output: "export",

  /* A otimização de imagem do Next exige um servidor para redimensionar sob
     demanda. Não há um aqui, e não faz falta: as imagens já saem do
     `scripts/textures.mjs` em WebP, na medida em que são exibidas. */
  images: { unoptimized: true },
};

export default nextConfig;
