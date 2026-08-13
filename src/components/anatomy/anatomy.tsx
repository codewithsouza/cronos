"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, invalidate } from "@react-three/fiber";
import { LAYERS } from "@/data/anatomy";
import { gsap, ScrollTrigger, initGsap, prefersReducedMotion } from "@/lib/motion";
import { AnatomyScene, type ProjectedPoint } from "./scene";

/**
 * Vista Anatomia — o momento assinatura.
 *
 * Ao rolar, o relógio não sai da tela: ele se decompõe. Cada camada sobe ou
 * desce no próprio eixo enquanto a câmera desce do topo para três-quartos, e
 * cada peça puxa a sua legenda por um fio Brushed de 1px.
 *
 * O scroll não controla a página aqui — controla o mecanismo.
 */
export function Anatomy() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const anchors = useRef<{ x: number; y: number }[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [reduced, setReduced] = useState(false);
  /* O Canvas só nasce no cliente: WebGL não existe no render do servidor. */
  const [mounted, setMounted] = useState(false);

  /* Onde cada legenda ancora o seu fio. Recalculado só no resize — ler layout
     a cada frame custaria caro e o valor não muda enquanto não muda o tamanho. */
  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.getBoundingClientRect();

    anchors.current = labelRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return {
        x: r.left - box.left,
        y: r.top - box.top + r.height / 2,
      };
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    setReduced(prefersReducedMotion());
    initGsap();
    measure();

    const section = sectionRef.current;
    if (!section) return;

    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          /* A cena é estática a menos que o scroll a mova. Com
             `frameloop="demand"`, é este invalidate que pede um frame — fora
             do scroll, a GPU fica ociosa em vez de redesenhar 60×/s à toa. */
          invalidate();
        },
      });

      /* ── A entrada, vinda de Novas peças ─────────────────────────────────
         Enquanto o plano de vídeo lá em cima é puxado para fora, o cabeçalho
         da bancada sobe para o lugar. Acaba exatamente onde o explode começa
         (`top top`), então as duas animações nunca disputam o mesmo scroll.

         Por que o cabeçalho, e não o relógio? O palco é `sticky top-0
         h-screen` e o relógio está no centro dele. Durante a entrada, só a
         metade de cima do palco chegou à tela — o relógio ainda está abaixo
         da borda inferior. Mover a peça (ou a câmera) neste trecho é animar
         o que ninguém está vendo. O que ocupa a tela aqui é o texto.

         E, sobretudo: NADA que transforme o canvas. Um `transform` CSS em
         volta dele o promove a camada própria e, dentro de um `sticky` que já
         é `transform-gpu`, o compositor passa a re-rasterizá-lo fora de
         registro — o relógio treme ao menor movimento do mouse. Foi
         exatamente o que a primeira versão desta transição causou. */
      gsap.fromTo(
        headerRef.current,
        { y: 56, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        },
      );
    }, section);

    return () => {
      ro.disconnect();
      ctx.revert();
    };
  }, [measure]);

  /* O que já está escrito no DOM. Escrever de novo o mesmo valor não é de graça:
     mexer no `d` de um path re-rasteriza a camada SVG inteira, que aqui cobre a
     tela toda e fica por cima do canvas. */
  const written = useRef<{ d: string; opacity: string }[]>(
    LAYERS.map(() => ({ d: "", opacity: "" })),
  );

  /* Chamado dentro do loop do R3F. Escreve direto no DOM: um setState por
     frame aqui derrubaria o framerate sem ganho nenhum. */
  const onFrame = useCallback((points: ProjectedPoint[]) => {
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const path = pathRefs.current[i];
      const dot = dotRefs.current[i];
      const label = labelRefs.current[i];
      const anchor = anchors.current[i];
      const last = written.current[i];
      if (!path || !dot || !label || !anchor) continue;

      /* Uma legenda invisível não precisa de fio: se ela está a 0 e já estava,
         não há nada a fazer neste frame. */
      const opacity = pt.opacity < 0.001 ? "0" : pt.opacity.toFixed(3);
      const opacityChanged = opacity !== last.opacity;

      if (opacityChanged) {
        path.style.opacity = opacity;
        dot.style.opacity = opacity;
        label.style.opacity = opacity;
        last.opacity = opacity;
      }

      if (opacity === "0") continue;

      const elbow = anchor.x - 32;
      /* Meio pixel de precisão. O fio tem 1px: a casa decimal seguinte não
         aparece na tela, e só serve para invalidar o cache acima. */
      const x = Math.round(pt.x * 2) / 2;
      const y = Math.round(pt.y * 2) / 2;
      const d = `M ${x} ${y} H ${elbow} V ${anchor.y} H ${anchor.x}`;

      if (d !== last.d) {
        path.setAttribute("d", d);
        dot.setAttribute("cx", String(x));
        dot.setAttribute("cy", String(y));
        last.d = d;
      }
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      /* Bone, e não Graphite como as seções de vídeo: sobre fundo escuro as
         peças perdem definição — o aço frio e a safira dependem de contraste
         claro para ler como metal, e não como silhueta. O mesmo Bone pinta o
         fundo da cena 3D (`scene.tsx`); os dois valores têm de casar. */
      className="relative bg-bone"
      /* O percurso do explode, e ele é a ÚNICA coisa que controla a velocidade
         percebida da seção.

         O que a seção mede não é a duração da animação — é quanto scroll ela
         consome. A altura menos uma tela (o palco é `sticky h-screen`) é o curso:
         a 260vh eram 160vh de percurso, ~1600px numa tela de 1000. Mil e
         seiscentos pixels de rolagem para separar sete peças fazem cada volta da
         roda mover quase nada, e a cena lê como travada — mesmo rodando a 80fps,
         o que ela faz.

         Foi por isso que 460vh já tinha virado 260vh. 180vh corta o curso pela
         metade de novo (80vh, ~800px): a mesma animação, o mesmo framerate,
         metade da mão.

         Encurtar MAIS que isso não acelera — atropela. As camadas partem
         escalonadas (`start = i * 0.05` em `scene.tsx`), então a última só tem
         70% do percurso para percorrer o dobro da distância das primeiras. Sem
         pista, ela chega ao fim antes de ter se separado. */
      style={{ height: "180vh" }}
      aria-labelledby="anatomia-title"
    >
      <div
        ref={stageRef}
        /* `translate-z-0` promove o palco a uma camada própria de composição.
           Sem isso o navegador repinta a região do sticky a cada frame de
           scroll, junto com tudo que estiver por baixo dela. */
        className="sticky top-0 h-screen w-full transform-gpu overflow-hidden"
      >
        {/* NENHUM transform CSS envolve este canvas, e isso é deliberado.
            Uma tentativa anterior fez o parallax de entrada com um `div`
            promovido (`will-change: transform`) em volta dele — e o relógio
            passou a tremer ao menor movimento do mouse: empilhar promoções de
            camada sobre um canvas WebGL, dentro de um `sticky` que já é
            `transform-gpu`, faz o compositor re-rasterizá-lo fora de registro.
            A entrada agora é um dolly de câmera, dentro da própria cena. */}
        {mounted && (
          <Canvas
            frameloop="demand"
            dpr={[1, 1.5]}
            /* Casa com a posição de repouso da câmera em `scene.tsx`
               (elevação 1.45, raio 12.8) — se divergir, o primeiro frame salta. */
            camera={{ fov: 32, position: [0, 12.71, 1.54], near: 0.1, far: 100 }}
            gl={{
              antialias: true,
              powerPreference: "high-performance",
              /* Canvas opaco: a cena pinta o próprio fundo, então não há nada
                 atrás para compor. Com alpha, cada frame é mesclado com a
                 página inteira. */
              alpha: false,
            }}
            className="absolute inset-0"
          >
            {/* As texturas das peças suspendem enquanto carregam. */}
            <Suspense fallback={null}>
              <AnatomyScene
                progress={progress}
                onFrame={onFrame}
                reduced={reduced}
              />
            </Suspense>
          </Canvas>
        )}

        {/* Véu de Bone sob a coluna de texto. Dois motivos, e o segundo não é
            estético: em telas estreitas (e em retrato) a peça ocupa a largura
            toda e o texto caía em cima do maquinário, ilegível. O gradiente
            devolve o contraste sem cortar a cena com uma borda dura — e, de
            quebra, afasta a tipografia do metal em qualquer tamanho de tela.
            É pintura pura: nenhum transform, nada que promova camada perto do
            canvas (ver a nota da entrada, acima).

            A direção muda com a tela, e não por capricho. No desktop o texto
            mora à esquerda da peça: o véu é horizontal e some antes do bisel.
            Em retrato a peça ocupa a largura inteira — um véu horizontal
            desbotava a metade esquerda dela, assimétrico e feio. Vertical, ele
            cobre a faixa de cima (onde o texto está) e devolve o relógio
            inteiro. */}
        <div className="pointer-events-none absolute left-0 top-0 h-[46%] w-full bg-gradient-to-b from-bone via-bone/85 to-transparent lg:h-full lg:w-[33%] lg:bg-gradient-to-r lg:via-bone/90" />

        {/* Os fios. Um px, Brushed, em ângulo reto — leitura de desenho técnico. */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {LAYERS.map((layer, i) => (
            <g key={layer.id}>
              <path
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                fill="none"
                stroke="var(--color-brushed)"
                strokeWidth="1"
                style={{ opacity: 0 }}
              />
              <circle
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                r="2.5"
                fill="var(--color-brushed)"
                style={{ opacity: 0 }}
              />
            </g>
          ))}
        </svg>

        {/* Cabeçalho da seção, fixo no canto — não compete com a peça. É ele
            que sobe na chegada (ver a entrada, acima). */}
        <div
          ref={headerRef}
          className="pointer-events-none absolute left-8 top-20 w-[min(26rem,42vw)] md:left-14"
        >
          {/* Um fio guiando o olho até o olho da seção — o mesmo traço de 1px
              dos fios das legendas. Fecha o vocabulário: tudo aqui é cota de
              desenho técnico. */}
          <div className="flex items-center gap-4">
            <div className="rule w-8 shrink-0" />
            <p className="eyebrow">Vista Anatomia</p>
          </div>

          {/* A escala é fluida como a do herói e a de Novas peças — antes, um
              `text-5xl` fixo deixava este título 30% menor que os vizinhos e a
              seção lia como nota de rodapé, não como o momento assinatura.

              O teto de 4rem não é gosto: acima disso a tinta da linha mais
              longa alcança o bisel, que numa tela de 1440 começa por volta de
              440px. O bloco também subiu (top-20) — junto ao topo a caixa do
              relógio é mais estreita, e é de lá que vem o espaço para crescer.

              A segunda linha em itálico faz dois trabalhos: dá o contraste
              editorial que um título de duas linhas em romano não tem, e o
              corte cursivo é mais estreito — cresce sem avançar. */}
          <h2
            id="anatomia-title"
            className="mt-6 font-display text-[clamp(2.5rem,4.2vw,4rem)] leading-[0.98] tracking-[-0.015em]"
          >
            Sete camadas,
            <br />
            <em className="italic text-slate">uma só peça.</em>
          </h2>

          <div className="rule mt-9 w-16" />

          <p className="mt-6 max-w-[34ch] text-[0.9375rem] leading-[1.8] text-slate">
            Role para desmontar o calibre. Cada camada é a mesma que sai da
            bancada, na ordem em que o relojoeiro a encontra.
          </p>
        </div>

        {/* Coluna de legendas, à direita. */}
        <div className="pointer-events-none absolute right-8 top-1/2 w-[10.5rem] -translate-y-1/2 space-y-9 md:right-14 md:w-56">
          {LAYERS.map((layer, i) => (
            <div
              key={layer.id}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              style={{ opacity: 0 }}
            >
              <p className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-graphite">
                {layer.label}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-steel">
                {layer.spec}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
