import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Anatomy } from "@/components/anatomy/anatomy";
import { Reveal } from "@/components/reveal";
import { PIECES, getPiece, formatPrice } from "@/data/pieces";

type Params = { params: Promise<{ ref: string }> };

export function generateStaticParams() {
  return PIECES.map((p) => ({ ref: p.ref.toLowerCase() }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { ref } = await params;
  const piece = getPiece(ref);
  if (!piece) return {};

  return {
    title: `${piece.ref} · ${piece.name}`,
    description: piece.note,
  };
}

export default async function PiecePage({ params }: Params) {
  const { ref } = await params;
  const piece = getPiece(ref);
  if (!piece) notFound();

  const specs = [
    ["Referência", piece.ref],
    ["Coleção", piece.collection],
    ["Calibre", piece.calibre],
    ["Reserva de marcha", piece.reserve],
    ["Rubis", String(piece.jewels)],
    ["Caixa", `${piece.case.material} · ${piece.case.diameter}`],
  ];

  return (
    <>
      {/* ── Cabeçalho da peça ────────────────────────────────────────────── */}
      <section data-dark className="bg-graphite px-8 pb-32 pt-44 text-bone md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <p className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            {piece.ref} · Coleção {piece.collection}
          </p>

          <h1 className="mt-8 font-display text-[clamp(3.5rem,9vw,8rem)] leading-[0.98]">
            {piece.name}
          </h1>

          <div className="mt-20 grid gap-16 md:grid-cols-[1.2fr_1fr]">
            <p className="max-w-[46ch] font-display text-2xl leading-[1.4] text-bone/80 md:text-3xl">
              {piece.note}
            </p>

            {/* Ficha técnica lida como instrumento: mono, alinhada, sem adjetivo. */}
            <dl className="space-y-0">
              {specs.map(([term, value]) => (
                <div
                  key={term}
                  className="flex items-baseline justify-between border-t border-bone/12 py-4"
                >
                  <dt className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
                    {term}
                  </dt>
                  <dd className="font-data text-xs tracking-[0.08em] text-bone">
                    {value}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between border-t border-bone/12 py-4">
                <dt className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
                  Valor
                </dt>
                <dd className="font-data text-xs tracking-[0.08em] text-brushed">
                  {formatPrice(piece.price)}
                </dd>
              </div>
            </dl>
          </div>

          {piece.edition && (
            <p className="mt-16 font-data text-[0.6875rem] uppercase tracking-[0.18em] text-brushed">
              {piece.edition} · numerada à mão
            </p>
          )}

          <div className="mt-16">
            <Link
              href={`/reserva?ref=${piece.ref}`}
              className="inline-block border border-bone/25 px-10 py-4 font-data text-[0.6875rem] uppercase tracking-[0.18em] text-bone transition-colors duration-300 hover:border-brushed hover:text-brushed"
            >
              Reservar peça
            </Link>
          </div>
        </div>
      </section>

      {/* ── A vista explodida ────────────────────────────────────────────── */}
      <Anatomy />

      {/* ── Outras peças ─────────────────────────────────────────────────── */}
      <section className="bg-fog px-8 py-32 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <p className="eyebrow">Outras peças</p>
            <ul className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-3">
              {PIECES.filter((p) => p.ref !== piece.ref).map((other) => (
                <li key={other.ref}>
                  <Link
                    href={`/pecas/${other.ref.toLowerCase()}`}
                    className="group block border-t border-brushed/50 pt-6 transition-colors duration-500 hover:border-graphite"
                  >
                    <p className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
                      {other.ref}
                    </p>
                    <p className="mt-3 font-display text-3xl">{other.name}</p>
                    <p className="mt-4 font-data text-xs tracking-[0.08em] text-slate">
                      {formatPrice(other.price)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
