import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "O tempo, esculpido. Precisão como valor moral, redução deliberada, mecanismo à vista.",
};

/* Sem imagens de apoio. O texto sustenta a página sozinho — é essa a aposta. */
const PILLARS = [
  {
    title: "Precisão como valor moral",
    body: "A exatidão do mecanismo não é uma especificação técnica que se anuncia num rodapé. É um princípio. Uma peça que atrasa dois segundos por dia não é uma peça com um defeito pequeno. É uma peça que falhou.",
  },
  {
    title: "Redução deliberada",
    body: "Retiramos o mostrador inteiro. Sobram os índices, os ponteiros e a máquina — nada acrescentado, nada a enfeitar. Cada elemento que sai aumenta o peso do que fica. O luxo, aqui, é o respiro. Nunca o preenchimento.",
  },
  {
    title: "Mecanismo à vista",
    body: "O movimento é a beleza. Fundos em safira e tourbillons expostos, nunca escondidos. Não há nada dentro desta caixa que precise ser poupado do seu olhar.",
  },
  {
    title: "Frieza editorial",
    body: "Não há ouro nesta marca. Não há tom quente, contador de estoque, selo de desconto. Uma peça CRONOS se apresenta como se apresenta uma escultura numa galeria: em silêncio, e sem pedir licença.",
  },
];

export default function ManifestoPage() {
  return (
    <div className="bg-bone px-8 pb-40 pt-44 md:px-14">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <p className="eyebrow">Manifesto</p>
          <h1 className="mt-8 max-w-[16ch] font-display text-[clamp(2.5rem,6vw,5rem)] leading-[1.06]">
            O tempo, esculpido.
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-20 max-w-[54ch] text-base leading-[1.8] text-slate">
            CRONOS trata o tempo como material, não como acessório. Cada peça
            é um objeto de engenharia elevado à condição de escultura. Não
            fabricamos para quem precisa exibir; fabricamos para quem reconhece
            a qualidade sem precisar anunciá-la.
          </p>
        </Reveal>

        <div className="mt-32 space-y-28">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title}>
              <article className="grid gap-8 md:grid-cols-[1fr_1.6fr]">
                <div>
                  <p className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-4 max-w-[14ch] font-display text-3xl leading-tight md:text-4xl">
                    {pillar.title}
                  </h2>
                </div>
                <div>
                  <div className="rule mb-8" />
                  <p className="max-w-[58ch] text-base leading-[1.8] text-slate">
                    {pillar.body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <blockquote className="mt-40 border-t border-brushed/50 pt-16">
            <p className="max-w-[20ch] font-display text-[clamp(2rem,4.5vw,3.75rem)] leading-[1.15]">
              Mede-se em séculos.
            </p>
          </blockquote>
        </Reveal>
      </div>
    </div>
  );
}
