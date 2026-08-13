import type { Metadata } from "next";
import { Suspense } from "react";
import { Reveal } from "@/components/reveal";
import { ReserveForm } from "@/components/reserve-form";

export const metadata: Metadata = {
  title: "Reserva",
  description:
    "Reserva de peça sob consulta. Sem carrinho, sem pressa: o atelier responde a cada pedido individualmente.",
};

export default function ReservaPage() {
  return (
    <div className="bg-bone px-8 pb-40 pt-44 md:px-14">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-24 md:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <p className="eyebrow">Reserva</p>
            <h1 className="mt-8 max-w-[12ch] font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.05]">
              Reservar uma peça.
            </h1>
            <p className="mt-12 max-w-[46ch] text-sm leading-[1.8] text-slate">
              Não há carrinho. Cada reserva é lida por uma pessoa e respondida
              individualmente, normalmente em dois dias úteis. Peças da linha
              Eclipse podem exigir espera de bancada.
            </p>

            <div className="rule mt-16" />

            <p className="mt-8 font-data text-[0.6875rem] uppercase leading-[2] tracking-[0.18em] text-steel">
              Atelier · São Paulo
              <br />
              Agendamento sob consulta
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <Suspense fallback={null}>
              <ReserveForm />
            </Suspense>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
