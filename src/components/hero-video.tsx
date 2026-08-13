"use client";

import { useEffect, useRef } from "react";
import { gsap, initGsap, prefersReducedMotion } from "@/lib/motion";
import { LoopVideo } from "./loop-video";

/**

 */
export function HeroVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const plane = planeRef.current;
    if (!section || !plane || prefersReducedMotion()) return;

    initGsap();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none", duration: 1 },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          /* Termina quando a base da seção alcança o topo da tela: o percurso
             da animação é exatamente a tela que o usuário rola para sair daqui. */
          end: "bottom top",
          scrub: true,
        },
      });

      /* O plano inteiro — vídeo e scrim — é puxado, sempre opaco. */
      tl.to(plane, { yPercent: -14, scale: 1.3 }, 0);

      /* A tipografia sai antes, e por dentro: some no meio do gesto, quando a
         puxada já se anunciou. Se as duas começassem juntas, o texto sumiria
         antes de o movimento ser lido e a saída viraria um fade comum. */
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
      data-dark
      data-nav-hide
      className="relative min-h-screen overflow-hidden bg-graphite"
    >
      {/* O plano que é puxado: vídeo, scrim e tipografia saem juntos como uma
          peça só. Animar a <section> em vez deste invólucro moveria também a
          caixa que o ScrollTrigger usa como referência. */}
      <div
        ref={planeRef}
        className="absolute inset-0 flex items-end px-8 pb-20 text-bone md:px-14"
      >
        <LoopVideo src="/video/hero" className="absolute inset-0 h-full w-full object-cover" />

        {/* O scrim. O vídeo é escuro, mas não é uniforme: sem esta rampa, a
            tipografia atravessaria um mostrador claro e sumiria. */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/70 to-graphite/30"
          aria-hidden="true"
        />

        <div ref={copyRef} className="relative mx-auto w-full max-w-[1400px]">
          <p className="eyebrow">Relojoaria mecânica</p>
          <h1 className="mt-6 font-display text-[clamp(3rem,8vw,7rem)] font-normal leading-[1.02]">
            O tempo,
            <br />
            <span className="text-brushed">esculpido.</span>
          </h1>
        </div>

        <p ref={cueRef} className="eyebrow absolute bottom-10 right-8 md:right-14">
          Role
        </p>
      </div>
    </section>
  );
}
