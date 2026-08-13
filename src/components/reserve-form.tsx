"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PIECES } from "@/data/pieces";

const FIELD =
  "w-full border-0 border-b border-brushed/60 bg-transparent py-3 text-sm text-graphite outline-none transition-colors duration-300 placeholder:text-steel/70 focus:border-graphite";

const LABEL =
  "font-data text-[0.6875rem] uppercase tracking-[0.18em] text-steel";

/**
 * Fluxo discreto: "Reservar peça", nunca "Comprar agora".
 *
 * Ainda não há backend — o submit apenas confirma na tela. Ligar a um endpoint
 * (ou a um e-mail do atelier) é o próximo passo.
 */
export function ReserveForm() {
  const params = useSearchParams();
  const preselected = params.get("ref") ?? "";
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="border-t border-graphite pt-10">
        <p className="eyebrow">Pedido registrado</p>
        <p className="mt-6 max-w-[38ch] font-display text-3xl leading-[1.3]">
          Recebemos o seu pedido. O atelier responde em até dois dias úteis.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-10"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div>
        <label className={LABEL} htmlFor="ref">
          Peça
        </label>
        <select
          id="ref"
          name="ref"
          defaultValue={preselected}
          required
          className={`${FIELD} appearance-none rounded-none`}
        >
          <option value="" disabled>
            Selecione uma referência
          </option>
          {PIECES.map((p) => (
            <option key={p.ref} value={p.ref}>
              {p.ref} · {p.name} · {p.collection}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL} htmlFor="name">
          Nome
        </label>
        <input id="name" name="name" type="text" required className={FIELD} />
      </div>

      <div>
        <label className={LABEL} htmlFor="email">
          E-mail
        </label>
        <input id="email" name="email" type="email" required className={FIELD} />
      </div>

      <div>
        <label className={LABEL} htmlFor="message">
          Mensagem
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Opcional."
          className={`${FIELD} resize-none`}
        />
      </div>

      <button
        type="submit"
        className="mt-4 border border-graphite px-10 py-4 font-data text-[0.6875rem] uppercase tracking-[0.18em] text-graphite transition-colors duration-300 hover:bg-graphite hover:text-bone"
      >
        Reservar peça
      </button>
    </form>
  );
}
