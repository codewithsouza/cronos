import Image from "next/image";
import Link from "next/link";
import { HeroVideo } from "@/components/hero-video";
import { NovasPecas } from "@/components/novas-pecas";
import { Anatomy } from "@/components/anatomy/anatomy";
import { Closing } from "@/components/closing";
import { Reveal } from "@/components/reveal";
import { PIECES, formatPrice } from "@/data/pieces";

export default function Home() {
  return (
    <>
      {/* ── Abertura ─────────────────────────────────────────────────────── */}
      {/* Os dois planos se trocam num gesto só: a abertura é puxada para fora
          enquanto Novas peças emerge de trás. Cada componente carrega a sua
          metade da transição. */}
      <HeroVideo />

      {/* ── Novas peças ──────────────────────────────────────────────────── */}
      <NovasPecas />

      {/* ── Vista Anatomia ───────────────────────────────────────────────── */}
      <Anatomy />

      {/* ── Manifesto, contido ───────────────────────────────────────────── */}
      <section className="bg-bone px-8 py-40 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="rule" />
          <Reveal className="mt-20 max-w-4xl">
            <p className="eyebrow">Fundamento</p>
            <p className="mt-8 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.3]">
              A exatidão do mecanismo é tratada como princípio, não como
              especificação. O que sobra, depois de retirar o ornamento, carrega
              mais peso.
            </p>
            <Link
              href="/manifesto"
              className="mt-12 inline-block font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel underline-offset-8 transition-colors duration-300 hover:text-graphite hover:underline"
            >
              Ler o manifesto
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Coleções ─────────────────────────────────────────────────────── */}
      <section className="bg-fog px-8 py-40 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">O catálogo</p>
            <h2 className="mt-6 font-display text-5xl md:text-6xl">
              Quatro peças.
            </h2>
          </Reveal>

          {/* O catálogo é a única seção sem movimento próprio — não tem vídeo nem
              cena. O que a mantém viva é o card: a peça mora num painel Graphite
              e se aproxima quando a mão chega, e a reserva sobe de baixo. É o
              mesmo contrato do resto do site (o gesto responde), na escala da
              mão em vez da do scroll.

              O card NÃO é um link envolvendo tudo: "Reservar" é um segundo
              destino, e âncora dentro de âncora não existe em HTML. O nome leva
              à peça e estica a própria área de clique sobre o card inteiro
              (`after:absolute after:inset-0`); a reserva sobe acima dessa camada
              pelo z-index e continua clicável. Um alvo grande, um alvo pequeno,
              marcação válida. */}
          <ul className="mt-24 grid gap-x-16 gap-y-24 md:grid-cols-2">
            {PIECES.map((piece, i) => (
              <Reveal
                as="li"
                key={piece.ref}
                delay={(i % 2) * 0.08}
                className="group relative flex flex-col"
              >
                {/* A vitrine.

                    Duas vistas empilhadas no mesmo quadro: a frontal em repouso,
                    a de lado por cima, invisível, esperando. Quando a mão chega,
                    uma some enquanto a outra aparece — é uma peça girando na
                    bancada, não duas fotos trocando de lugar.

                    O QUADRO É QUADRADO porque a fotografia é. Num painel 5:4 o
                    `object-cover` tinha de comer uma faixa em cima e outra
                    embaixo para preencher, e comia justamente onde a peça estava:
                    o bisel de cima e o fecho da pulseira. Igualando a proporção do
                    painel à da foto, não sobra nada para cortar — a peça entra
                    inteira, e é o enquadramento do fotógrafo que vale, não um
                    recorte inventado pelo CSS.

                    A troca é só opacidade, sem escala. Uma peça girando não muda
                    de tamanho; ampliar uma das vistas na entrada punha de volta,
                    em movimento, o corte que acabamos de tirar.

                    Sem `side` a peça não fica sem resposta — a frontal sozinha se
                    aproxima. Um gesto mais pobre, mas um gesto. */}
                <div className="relative aspect-square overflow-hidden bg-graphite">
                  <Image
                    src={piece.image.front}
                    alt={`Relógio ${piece.name}, referência ${piece.ref}`}
                    fill
                    sizes="(min-width: 768px) 46vw, 92vw"
                    className={`object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1.36,0.32,1)] ${
                      piece.image.side
                        ? "group-hover:opacity-0"
                        : "group-hover:scale-105"
                    }`}
                  />

                  {piece.image.side && (
                    <Image
                      src={piece.image.side}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="(min-width: 768px) 46vw, 92vw"
                      className="object-cover opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1.36,0.32,1)] group-hover:opacity-100"
                    />
                  )}

                  {/* Sobe de baixo com a mão. `translate-y-full` a mantém fora do
                      painel em repouso — sem opacidade zero, porque o que se quer
                      é o gesto de entrar, não o de acender.

                      Num aparelho de toque não existe hover, e a reserva ficaria
                      inalcançável: `(hover: none)` a deixa sempre presente. O
                      teclado chega por `focus-visible`. O gesto é um luxo de quem
                      tem ponteiro; o destino é de todo mundo. */}
                  <Link
                    href={`/reserva?ref=${piece.ref}`}
                    className="absolute inset-x-0 bottom-0 z-10 translate-y-full bg-bone/95 py-4 text-center font-data text-[0.6875rem] uppercase tracking-[0.18em] text-graphite transition-transform duration-500 ease-[cubic-bezier(0.16,1.36,0.32,1)] group-hover:translate-y-0 focus-visible:translate-y-0 [@media(hover:none)]:translate-y-0"
                  >
                    Reservar
                  </Link>
                </div>

                <div className="mt-8 flex items-baseline justify-between">
                  <p className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
                    {piece.ref}
                  </p>
                  <p className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
                    {piece.collection}
                  </p>
                </div>

                <div className="mt-4 h-px w-full bg-brushed/50 transition-colors duration-500 ease-[cubic-bezier(0.16,1.36,0.32,1)] group-hover:bg-graphite" />

                <h3 className="mt-8 font-display text-4xl md:text-5xl">
                  <Link
                    href={`/pecas/${piece.ref.toLowerCase()}`}
                    className="transition-colors duration-300 after:absolute after:inset-0 after:content-[''] hover:text-slate"
                  >
                    {piece.name}
                  </Link>
                </h3>

                <p className="mt-6 max-w-[42ch] text-sm leading-relaxed text-slate">
                  {piece.note}
                </p>

                <dl className="mt-10 grid grid-cols-2 gap-y-4 font-data text-[0.6875rem] uppercase tracking-[0.14em] sm:grid-cols-4">
                  {[
                    ["Calibre", piece.calibre],
                    ["Reserva", piece.reserve],
                    ["Caixa", piece.case.material],
                    ["Diâmetro", piece.case.diameter],
                  ].map(([term, value]) => (
                    <div key={term}>
                      <dt className="text-steel">{term}</dt>
                      <dd className="mt-1.5 text-graphite">{value}</dd>
                    </div>
                  ))}
                </dl>

                {/* `mt-auto` ancora o preço no pé do card. Os quatro cards são
                    esticados à altura do mais alto pelo grid, então o valor sai
                    na mesma linha nos quatro — mesmo que uma nota corra mais que
                    a outra, ou que uma ficha quebre onde a vizinha não quebrou.
                    Alinhamento por estrutura, não por contagem de caracteres. */}
                <p className="mt-auto pt-10 font-data text-xs tracking-[0.1em] text-graphite">
                  {formatPrice(piece.price)}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Fecho ────────────────────────────────────────────────────────── */}
      {/* Sem texto. O argumento já foi feito; aqui só se vê a peça no pulso. */}
      <Closing />
    </>
  );
}
