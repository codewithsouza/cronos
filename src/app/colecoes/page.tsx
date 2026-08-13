import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { piecesByCollection, formatPrice, type Collection } from "@/data/pieces";

export const metadata: Metadata = {
  title: "Coleções",
  description:
    "Monólito e Eclipse. Duas linhas, quatro peças. Cada uma tratada como página de galeria.",
};

/**
 * O que separa as duas linhas é a CAIXA, não o mecanismo.
 *
 * As quatro peças mostram o tourbillon — nenhuma esconde nada, e é por isso que
 * o eixo antigo ("automáticas e caladas" contra "complicação à vista") não
 * descrevia mais o catálogo. O que de fato as divide é o que a caixa faz: no
 * Monólito ela é matéria retirada de um bloco (aço maciço, safira maciça); no
 * Eclipse ela é um regime de luz (a cerâmica engole, a platina devolve).
 *
 * Cada nome volta a significar o que diz. Ao acrescentar uma peça, é esta a
 * pergunta: a caixa dela é um bloco, ou é uma lei óptica?
 */
const COLLECTIONS: { name: Collection; blurb: string }[] = [
  {
    name: "Monólito",
    blurb:
      "A caixa é um bloco só — aço maciço, safira maciça. Nada é montado em volta do mecanismo: a matéria é retirada até que sobre apenas o necessário para segurá-lo.",
  },
  {
    name: "Eclipse",
    blurb:
      "O topo, e uma oposição de luz. Uma caixa que engole o brilho inteiro; outra que o devolve inteiro. O mesmo tourbillon, sob duas leis ópticas opostas.",
  },
];

export default function ColecoesPage() {
  return (
    <div className="bg-bone px-8 pb-40 pt-44 md:px-14">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <p className="eyebrow">O catálogo</p>
          <h1 className="mt-6 max-w-[14ch] font-display text-[clamp(3rem,7vw,6rem)] leading-[1.02]">
            Duas linhas.
          </h1>
        </Reveal>

        {COLLECTIONS.map((collection) => (
          <section key={collection.name} className="mt-40 first:mt-32">
            <Reveal>
              <div className="rule" />
              <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.4fr]">
                <h2 className="font-display text-5xl md:text-6xl">
                  {collection.name}
                </h2>
                <p className="max-w-[52ch] text-sm leading-relaxed text-slate">
                  {collection.blurb}
                </p>
              </div>
            </Reveal>

            <ul className="mt-24 grid gap-x-16 gap-y-28 md:grid-cols-2">
              {piecesByCollection(collection.name).map((piece, i) => (
                <Reveal as="li" key={piece.ref} delay={i * 0.08}>
                  <Link
                    href={`/pecas/${piece.ref.toLowerCase()}`}
                    className="group block"
                  >
                    <p className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
                      {piece.ref}
                    </p>

                    <h3 className="mt-5 font-display text-4xl md:text-5xl">
                      {piece.name}
                    </h3>

                    <div className="mt-8 h-px w-full bg-brushed/40 transition-colors duration-500 group-hover:bg-graphite" />

                    <p className="mt-8 max-w-[44ch] text-sm leading-relaxed text-slate">
                      {piece.note}
                    </p>

                    {piece.edition && (
                      <p className="mt-6 font-data text-[0.6875rem] uppercase tracking-[0.18em] text-brushed">
                        {piece.edition}
                      </p>
                    )}

                    <p className="mt-10 font-data text-xs tracking-[0.1em]">
                      {formatPrice(piece.price)}
                    </p>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
