"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, initGsap, prefersReducedMotion } from "@/lib/motion";

/**
 * O fecho. A única cena de uso do site, e a última coisa antes do rodapé.
 *
 * Sem tipografia por cima — de propósito. O site inteiro fala: a abertura tem
 * manchete, a anatomia tem legenda saindo de cada peça, o catálogo tem ficha.
 * Aqui ele para de falar. Depois de sete camadas desmontadas e quatro fichas
 * técnicas, o argumento já foi feito; o que sobra é a peça no pulso de alguém,
 * e uma palavra em cima disso seria uma legenda explicando a piada.
 *
 * É uma FAIXA, e não uma seção de tela cheia. O fecho não tem argumento a fazer
 * — o argumento acabou no catálogo. Ele só assina. Uma faixa baixa lê como ponto
 * final; um plano de 100vh voltaria a pedir atenção, e pedir atenção depois de
 * ter dito tudo é hesitar.
 *
 * O que ela NÃO é: um respiro vazio. A faixa se move — devagar, mais devagar
 * que a página, do mesmo jeito que a abertura e o Novas peças se movem. Um
 * plano parado aqui seria a única coisa morta de um site que respira inteiro.
 * O gesto é o mesmo daquelas seções, e a conta também: um plano deslocado de Y%
 * só continua cobrindo a caixa se a escala S sobrar (S−1)/2 de folga de cada
 * lado. Com Y indo de −8 a +8 e S = 1.16, a folga é exatamente 8% — nenhuma
 * borda entra no quadro em nenhum ponto do percurso.
 *
 * O curso cheio só é possível porque a fotografia é larga (3168px). A versão
 * anterior tinha 1376 e já entrava AMPLIADA numa tela de 1920 — ali cada ponto
 * de escala custava nitidez de verdade, e o curso teve de ser cortado pela
 * metade. Com a fonte larga, o fecho é reduzido em qualquer tela e o zoom do
 * parallax sai de graça. Trocar a foto por uma estreita de novo traz o problema
 * de volta.
 *
 * A base dela é comida pela faixa de gradiente do rodapé (ver `footer.tsx`), e
 * é assim que tem de ser: a cena não termina, ela escurece até virar o rodapé.
 */
export function Closing() {
  const sectionRef = useRef<HTMLElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const plane = planeRef.current;
    if (!section || !plane || prefersReducedMotion()) return;

    initGsap();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        plane,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
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
      className="relative h-[58vh] min-h-[340px] overflow-hidden bg-graphite"
    >
      {/* `will-change` promove só esta camada. Sem isso, o browser repinta a
          fotografia inteira a cada frame do scrub. */}
      <div
        ref={planeRef}
        className="absolute inset-0 scale-[1.16] will-change-transform"
      >
        {/* O `?v=` fura o cache do otimizador de imagem do Next, que é indexado
            pela URL. Sem ele, trocar a fotografia no disco não troca nada na
            tela: o caminho continua `/fecho.webp` e o Next devolve o derivado
            que já tem guardado — foi exatamente o que aconteceu quando esta foto
            substituiu a primeira. Suba o número a cada troca de imagem, como o
            `parts.tsx` já faz com as texturas da anatomia. */}
        <Image
          src="/fecho.webp?v=2"
          alt="Um CRONOS no pulso, contra a luz de uma janela."
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* O scrim do topo. Não é decoração: a nav flutua aqui em modo escuro —
          texto Bone, sem fundo —, e a janela desta fotografia é a área mais clara
          do site inteiro. Sem isso, os links somem contra o vidro.

          Ele mora FORA do plano que se move: preso ao scrub, o degradê subiria e
          desceria junto com a foto, e a proteção sairia de baixo da nav
          exatamente quando ela mais precisa. A nav é fixa; o escudo dela também
          tem de ser. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-graphite/80 via-graphite/30 to-transparent"
      />
    </section>
  );
}
