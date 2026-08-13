import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-graphite px-8 pb-14 pt-24 text-bone md:px-14">
      {/* O respiro antes do escuro.

          O footer é a única troca de tom do site que acontecia num corte seco:
          a seção acima termina em Bone ou Fog e a linha seguinte já é Graphite.
          Todas as outras trocas são atravessadas por um gesto — a abertura é
          puxada para fora, a anatomia se desmonta —, e esta não tinha nenhum.

          A faixa mora FORA da caixa do footer (`-top-24`), pintando sobre o pé
          da seção anterior, que é só respiro vazio. Como ela nasce transparente,
          serve a qualquer fundo: o Fog do catálogo na home, o Bone do manifesto,
          o Fog das outras peças. Uma faixa só, e não uma por página. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-40 bg-gradient-to-b from-transparent via-graphite/40 to-graphite"
      />

      <div className="mx-auto max-w-[1400px]">
        <div className="rule opacity-25" />

        <div className="mt-14 grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl leading-tight md:text-4xl">
              O tempo,
              <br />
              esculpido.
            </p>
          </div>

          <nav>
            <p className="eyebrow text-steel">Navegação</p>
            <ul className="mt-5 space-y-3">
              {[
                { href: "/colecoes", label: "Coleções" },
                { href: "/manifesto", label: "Manifesto" },
                { href: "/reserva", label: "Reserva" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-bone/60 transition-colors duration-300 hover:text-brushed"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow text-steel">Atelier</p>
            <address className="mt-5 space-y-3 text-sm not-italic text-bone/60">
              <p>
                Agendamento sob consulta
                <br />
                São Paulo · Brasil
              </p>
              <p>
                <a
                  href="mailto:atelier@cronos.watch"
                  className="transition-colors duration-300 hover:text-brushed"
                >
                  atelier@cronos.watch
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            CRONOS · Relojoaria mecânica
          </p>
          <p className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel">
            Mede-se em séculos
          </p>
        </div>
      </div>
    </footer>
  );
}
