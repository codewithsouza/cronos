"use client";

import { useEffect, useRef } from "react";
import { gsap, initGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * O único item que se move de verdade em toda a identidade.
 *
 * Ao carregar, o relógio "dá corda": os ponteiros varrem de zero até a hora
 * real. Depois disso o ponteiro dos segundos avança um passo por segundo, com
 * o overshoot do escape — nunca em varredura contínua.
 *
 * O desenho segue a mesma anatomia da cena 3D: caixa e bisel em anéis
 * concêntricos, rehaut com o trilho de minutos, índices baton, ponteiros em
 * agulha. O Brushed aparece uma única vez — no fio dos segundos.
 */

/* GSAP aplica transform de SVG pelo atributo, não pelo CSS: um transform-origin
   no style é ignorado e a rotação cai no centro do bounding box de cada
   ponteiro — que gira em torno do próprio meio e sai do eixo. `svgOrigin` fixa
   o pivô em coordenadas do viewBox, imune à escala do CSS. */
const PIVOT = "200 200";

export function LiveClock({ className }: { className?: string }) {
  const hourRef = useRef<SVGGElement>(null);
  const minuteRef = useRef<SVGGElement>(null);
  const secondRef = useRef<SVGGElement>(null);
  const dialRef = useRef<SVGGElement>(null);

  useEffect(() => {
    initGsap();

    const hour = hourRef.current;
    const minute = minuteRef.current;
    const second = secondRef.current;
    if (!hour || !minute || !second) return;

    const angles = () => {
      const now = new Date();
      const s = now.getSeconds();
      const m = now.getMinutes();
      const h = now.getHours() % 12;
      return {
        second: s * 6,
        minute: m * 6 + s * 0.1,
        hour: h * 30 + m * 0.5,
      };
    };

    const reduced = prefersReducedMotion();
    let frame = 0;
    let lastSecond = -1;
    let onScreen = true;
    let observer: IntersectionObserver | null = null;

    const ctx = gsap.context(() => {
      /* O pivô é declarado uma vez; todos os tweens seguintes o reutilizam. */
      gsap.set([hour, minute, second], { svgOrigin: PIVOT, rotate: 0 });

      const target = angles();

      if (reduced) {
        gsap.set(hour, { rotate: target.hour });
        gsap.set(minute, { rotate: target.minute });
        gsap.set(second, { rotate: target.second });
      } else {
        /* Dar corda: os ponteiros varrem até a posição, o rápido primeiro. */
        gsap.set(dialRef.current, { opacity: 0 });
        gsap.to(dialRef.current, { opacity: 1, duration: 1.1, ease: "power2.out" });

        gsap.to(hour, { rotate: target.hour, duration: 2.4, ease: "power3.inOut" });
        gsap.to(minute, {
          rotate: target.minute,
          duration: 2.1,
          ease: "power3.inOut",
          delay: 0.1,
        });
        gsap.to(second, {
          rotate: target.second,
          duration: 1.8,
          ease: "power3.inOut",
          delay: 0.2,
        });
      }

      /* A partir daqui, o batimento. Um passo por segundo, com trava. */
      let running = false;

      const start = () => {
        if (running) return;
        running = true;

        const loop = () => {
          if (!running) return;

          const now = new Date();
          const s = now.getSeconds();

          if (s !== lastSecond) {
            lastSecond = s;
            const a = angles();

            if (reduced) {
              gsap.set(second, { rotate: a.second });
            } else {
              /* O ponteiro precisa continuar girando ao virar o minuto:
                 em vez de voltar a 0°, seguimos somando 6° sobre o ângulo atual. */
              const current = (gsap.getProperty(second, "rotate") as number) ?? 0;
              const next = Math.round(current / 6) * 6 + 6;
              gsap.to(second, { rotate: next, duration: 0.16, ease: "tick" });
            }

            gsap.set(minute, { rotate: a.minute });
            gsap.set(hour, { rotate: a.hour });
          }

          frame = requestAnimationFrame(loop);
        };
        loop();
      };

      const stop = () => {
        running = false;
        cancelAnimationFrame(frame);
      };

      /* O relógio só bate enquanto está na tela.
         Sem isto, o loop segue rodando um frame por vez — e um tween por
         segundo — enquanto o usuário está lá embaixo desmontando o calibre,
         disputando o main thread com a cena 3D para mover um ponteiro que
         ninguém está vendo. */
      let wound = reduced;
      const svg = second.ownerSVGElement;

      observer = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting;
          if (onScreen && wound) start();
          if (!onScreen) stop();
        },
        { threshold: 0 },
      );

      if (svg) observer.observe(svg);

      /* Só começa a bater depois que a corda terminou. */
      const delay = reduced ? 0 : 2.4;
      gsap.delayedCall(delay, () => {
        wound = true;
        if (onScreen) start();
      });
    });

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      ctx.revert();
    };
  }, []);

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="Relógio CRONOS em tempo real"
    >
      <g ref={dialRef}>
        {/* Coroa, a 3h. É ela que ancora a leitura "relógio de pulso". */}
        <g opacity="0.5">
          <rect x="387" y="192.5" width="10" height="15" rx="2.5" fill="currentColor" opacity="0.55" />
          <line x1="390.5" y1="194.5" x2="390.5" y2="205.5" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
          <line x1="393.5" y1="194.5" x2="393.5" y2="205.5" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
        </g>

        {/* Caixa e bisel — a mesma pilha de anéis do Bisel da cena 3D:
            flanco polido, banda usinada, aro interno escuro. */}
        <circle cx="200" cy="200" r="188" fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.5" />
        <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="10" opacity="0.08" />
        <circle cx="200" cy="200" r="185" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <circle cx="200" cy="200" r="175" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />

        {/* O mostrador mal se separa do fundo — como o slate sobre o grafite. */}
        <circle cx="200" cy="200" r="170" fill="currentColor" opacity="0.035" />

        {/* Rehaut: o trilho dos minutos. Sessenta fios; o quinto mais fundo. */}
        {Array.from({ length: 60 }, (_, i) => {
          const major = i % 5 === 0;
          return (
            <line
              key={i}
              x1="200"
              y1="32"
              x2="200"
              y2={major ? "44" : "38.5"}
              stroke="currentColor"
              strokeWidth={major ? 1.5 : 0.75}
              opacity={major ? 0.55 : 0.28}
              transform={`rotate(${i * 6} 200 200)`}
            />
          );
        })}

        {/* Índices baton. Sem numeral — a hora lida pela geometria.
            O de 12h é duplo, como manda a gramática do mostrador. */}
        {Array.from({ length: 12 }, (_, i) =>
          i === 0 ? (
            <g key={i}>
              <line x1="196.5" y1="52" x2="196.5" y2="74" stroke="currentColor" strokeWidth="3" opacity="0.75" />
              <line x1="203.5" y1="52" x2="203.5" y2="74" stroke="currentColor" strokeWidth="3" opacity="0.75" />
            </g>
          ) : (
            <line
              key={i}
              x1="200"
              y1="52"
              x2="200"
              y2="74"
              stroke="currentColor"
              strokeWidth="3"
              opacity="0.75"
              transform={`rotate(${i * 30} 200 200)`}
            />
          ),
        )}

        {/* A assinatura, no lugar de sempre: sob o 12. */}
        <text
          x="200"
          y="128"
          textAnchor="middle"
          fill="currentColor"
          opacity="0.6"
          fontSize="12"
          letterSpacing="5"
          style={{ fontFamily: "var(--font-data)" }}
        >
          CRONOS
        </text>
        <text
          x="200"
          y="292"
          textAnchor="middle"
          fill="currentColor"
          opacity="0.35"
          fontSize="7"
          letterSpacing="2.5"
          style={{ fontFamily: "var(--font-data)" }}
        >
          AUTOMATIC
        </text>

        {/* Ponteiro das horas — agulha afilada, com corpo. */}
        <g ref={hourRef}>
          <polygon
            points="196.6,196 197.6,128 200,120 202.4,128 203.4,196"
            fill="currentColor"
          />
        </g>

        {/* Ponteiro dos minutos — mesma agulha, mais fina e mais longa. */}
        <g ref={minuteRef}>
          <polygon
            points="197.6,196 198.4,80 200,72 201.6,80 202.4,196"
            fill="currentColor"
          />
        </g>

        {/* Ponteiro dos segundos — o fio Brushed de 1px, com contrapeso. */}
        <g ref={secondRef}>
          <line x1="200" y1="232" x2="200" y2="60" stroke="var(--color-brushed)" strokeWidth="1" />
          <circle cx="200" cy="225" r="3.5" fill="var(--color-brushed)" />
        </g>

        {/* O canhão central: tampa em aço, cap Brushed por cima. */}
        <circle cx="200" cy="200" r="7" fill="currentColor" />
        <circle cx="200" cy="200" r="2.5" fill="var(--color-brushed)" />
      </g>
    </svg>
  );
}
