"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Props = {
  /** Sem extensão: `/video/hero` carrega `hero.webm`, `hero.mp4`, `hero-poster.webp`. */
  src: string;
  className?: string;
  /** Descrição para leitores de tela. Sem ela, o vídeo é decorativo e some da árvore. */
  label?: string;
};

/**
 * Vídeo de fundo em loop — a única forma de imagem em movimento do site.
 *
 * Ele não é conteúdo, é superfície: sem controles, sem áudio (a faixa foi
 * removida do arquivo, não silenciada no player) e sem pedir nada ao usuário.
 *
 * Duas fontes, na ordem em que o navegador deve preferi-las: o WebM/VP9 é o
 * arquivo original copiado sem recodificar — zero perda de geração —, e o
 * MP4/H.264 existe para quem não toca VP9.
 */
export function LoopVideo({ src, className, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    /* Quem pediu menos movimento recebe o primeiro quadro, parado. */
    if (prefersReducedMotion()) {
      video.pause();
      return;
    }

    /* O autoplay pode ser recusado (política de energia, aba em segundo plano).
       Não é erro: o poster fica e a página não quebra. */
    void video.play().catch(() => {});

    /* Fora da tela, o decodificador para. Sem isto, um 1080p segue decodificando
       enquanto o usuário está lá embaixo desmontando o calibre — disputando o
       main thread com a cena 3D para mover pixels que ninguém está vendo. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      /* `muted` + `playsInline` são o que autoriza o autoplay: sem os dois, o
         vídeo simplesmente não começa no celular. */
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster={`${src}-poster.webp`}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
    >
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  );
}
