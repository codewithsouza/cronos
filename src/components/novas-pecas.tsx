"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap, initGsap, prefersReducedMotion } from "@/lib/motion";
import { LoopVideo } from "./loop-video";

/**
 * Novas peças. A mesma gramática da abertura — o vídeo preenche a tela, a
 * tipografia mora por cima —, mas com o texto à esquerda e o scrim na
 * horizontal, para o plano respirar do outro lado.
 *
 * Esta seção tem DOIS gestos, e eles não se atropelam porque ocupam trechos de
 * scroll disjuntos: a entrada acaba exatamente onde a saída começa (quando o
 * topo da seção alcança o topo da tela).
 *
 * ENTRADA — o plano emerge de trás
 *   Enquanto a abertura é puxada para fora, este vídeo entra mais devagar que a
 *   página: sobe com um resto de atraso e assenta a escala ao chegar. As duas
 *   velocidades opostas são o que faz a troca ler como profundidade, em vez de
 *   duas telas trocando de lugar.
 *
 * SAÍDA — o plano é puxado, e a Anatomia aparece por baixo
 *   O mesmo gesto da abertura, pelas mesmas razões. Só a tipografia se dissolve;
 *   o vídeo atravessa a saída OPACO. Se ele ficasse translúcido antes de a caixa
 *   da seção sair da tela, revelaria o próprio Graphite — uma tarja lisa colada
 *   no topo da seção seguinte, que passaria a parecer mais curta que a tela.
 *
 * Os dois transforms vivem em invólucros ANINHADOS, e não no mesmo elemento: a
 * entrada mora no invólucro do vídeo, a saída no plano que o contém. Empilhados
 * num nó só, o segundo scrub sobrescreveria o primeiro.
 */
export function NovasPecas() {
  const sectionRef = useRef<HTMLElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const plane = planeRef.current;
    const video = videoRef.current;
    if (!section || !plane || !video || prefersReducedMotion()) return;

    initGsap();

    const ctx = gsap.context(() => {
      /* ── Entrada ──────────────────────────────────────────────────────────
         A escala precisa cobrir o deslocamento, senão a borda de cima do vídeo
         entra no quadro e sobra uma faixa vazia. Um plano deslocado de Y% só
         continua cobrindo se a escala S sobrar (S−1)/2 de folga em cada lado —
         ou seja, Y ≤ (S−1)/2 × 100. Com Y=6 e S=1.16 a folga é 8%. */
      gsap.fromTo(
        video,
        { yPercent: 6, scale: 1.16 },
        {
          yPercent: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        },
      );

      /* ── Saída ────────────────────────────────────────────────────────────
         A escala paga a puxada, pela mesma conta, agora no sentido inverso:
         subir o plano Y% descobriria a BASE da seção. Igualando os dois no fim
         do percurso — (S−1)/2 = |Y| — eles se anulam em todo instante.
         1.30 e 14%: nenhum Graphite à mostra em nenhum ponto. */
      const tl = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      tl.to(plane, { yPercent: -14, scale: 1.3 }, 0);
      tl.to(
        [copyRef.current, cueRef.current],
        { opacity: 0, duration: 0.5, ease: "power2.in" },
        0.25,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      /* `data-dark`: a nav lê a base da última seção escura para saber onde
         trocar de cor. Ver `components/nav.tsx`. */
      data-dark
      className="relative min-h-screen overflow-hidden bg-graphite"
    >
      {/* O plano que é puxado na saída: vídeo, scrim e tipografia saem juntos
          como uma peça só. */}
      <div
        ref={planeRef}
        className="absolute inset-0 flex items-center px-8 text-bone md:px-14"
      >
        {/* O invólucro do parallax de entrada. `will-change` promove só esta
            camada — sem isso, o browser repinta o quadro de vídeo inteiro a
            cada frame do scrub. */}
        <div ref={videoRef} className="absolute inset-0 will-change-transform">
          <LoopVideo
            src="/video/pecas"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* O scrim é horizontal, não vertical como o da abertura: aqui o texto
            fica à esquerda e o plano precisa respirar à direita. Opaco na coluna
            do texto, quase limpo do outro lado. */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/80 to-graphite/10"
          aria-hidden="true"
        />

        <div ref={copyRef} className="relative mx-auto w-full max-w-[1400px]">
          <div className="max-w-xl">
            <p className="eyebrow">O princípio</p>

            {/* h2: o h1 da página é a abertura em vídeo. */}
            <h2 className="mt-6 font-display text-[clamp(2.75rem,6vw,5.25rem)] font-normal leading-[1.05]">
              Novas peças
            </h2>

            <p className="mt-8 font-display text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.3] text-brushed">
              Todo relógio mede o tempo. O nosso o torna visível como forma.
            </p>

            <div className="mt-12 flex items-center gap-8">
              <Link
                href="/colecoes"
                className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-bone underline-offset-8 transition-colors duration-300 hover:text-brushed hover:underline"
              >
                Ver coleções
              </Link>
              <Link
                href="/manifesto"
                className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel underline-offset-8 transition-colors duration-300 hover:text-brushed hover:underline"
              >
                Manifesto
              </Link>
            </div>
          </div>
        </div>

        <p
          ref={cueRef}
          className="eyebrow absolute bottom-10 right-8 md:right-14"
        >
          Role para desmontar
        </p>
      </div>
    </section>
  );
}
