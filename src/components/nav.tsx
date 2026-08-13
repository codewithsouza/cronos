"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const LINKS = [
  { href: "/colecoes", label: "Coleções" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/reserva", label: "Reserva" },
];

/**
 * A nav tem três estados, e os três são ditados pelo que está atrás dela.
 *
 *   hidden — sobre a abertura em vídeo. O plano é para ser visto inteiro;
 *            nada flutua por cima dele.
 *   dark   — sobre as seções em Graphite. Texto Bone, sem fundo.
 *   light  — sobre as seções em Bone. Texto Graphite, fundo Bone.
 *
 * A solução óbvia para os dois últimos — `mix-blend-difference` — obriga o
 * browser a recompor a viewport inteira a cada frame de scroll. Sobre um canvas
 * WebGL isso derruba o site. Em vez disso, trocamos a classe em dois pontos do
 * scroll: sem blend, sem backdrop-filter, e só quando de fato cruza o limite.
 *
 * Os limites não são chutados em múltiplos de 100vh — quem sabe onde cada faixa
 * termina é o DOM. As seções se marcam (`data-nav-hide`, `data-dark`) e a nav
 * mede a caixa delas, remedindo no resize.
 *
 * A pergunta é "sobre QUAL faixa eu estou", e não "já passei do ponto".
 *
 * A distinção não é acadêmica. Enquanto todo o escuro vinha antes de todo o
 * claro, um limite único bastava — bastava saber se o scroll já tinha passado da
 * base da última seção escura. O fecho, que é escuro e mora DEPOIS do catálogo
 * claro, destrói essa premissa: com um limite só, a nav lia "ainda estou no
 * escuro" ao longo do catálogo inteiro e servia texto Bone sobre fundo Bone.
 * Guardar as faixas e testar pertinência custa o mesmo e não depende da ordem
 * em que as seções aparecem na página.
 */

/* O palpite do servidor, só para o primeiro quadro: estas rotas abrem escuras.
   O efeito mede o DOM e corrige — mas ele roda depois da pintura, e sem o
   palpite a nav piscaria clara sobre o vídeo. A home abre escondida; as peças,
   escuras. */
function initialState(pathname: string): "hidden" | "dark" | "light" {
  if (pathname === "/") return "hidden";
  if (pathname.startsWith("/pecas/")) return "dark";
  return "light";
}

export function Nav() {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* As faixas escondidas e as escuras, como intervalos [topo, base] no
       documento. Guardadas, e não reduzidas a um número, porque a ordem delas na
       página não é garantida — ver o comentário do componente. */
    type Band = { top: number; bottom: number };
    let hidden: Band[] = [];
    let dark: Band[] = [];

    const bandsOf = (selector: string): Band[] =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).map((el) => ({
        top: el.offsetTop,
        bottom: el.offsetTop + el.offsetHeight,
      }));

    const measure = () => {
      hidden = bandsOf("[data-nav-hide]");
      dark = bandsOf("[data-dark]");
    };

    /* Os 80px são a altura da própria nav: quem decide a cor é o que está atrás
       da BASE dela, não do topo da página. */
    const NAV_H = 80;
    const inside = (bands: Band[], y: number) =>
      bands.some((b) => y >= b.top && y < b.bottom);

    let ticking = false;
    let over = "";

    const apply = () => {
      ticking = false;
      const probe = window.scrollY + NAV_H;
      const next = inside(hidden, probe)
        ? "hidden"
        : inside(dark, probe)
          ? "dark"
          : "light";
      if (next === over) return;
      over = next;
      el.dataset.over = next;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    const onResize = () => {
      measure();
      apply();
    };

    measure();
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  return (
    <header
      ref={ref}
      data-over={initialState(pathname)}
      /* Escondida, ela também sai do caminho do ponteiro e do teclado:
         `invisible` retira do fluxo de foco, `opacity-0` dá a transição. */
      className="group fixed inset-x-0 top-0 z-50 transition-[background-color,opacity,visibility] duration-500 data-[over=hidden]:invisible data-[over=hidden]:opacity-0 data-[over=light]:bg-bone/95"
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-7 md:px-14">
        <Link
          href="/"
          className="font-display text-[0.95rem] tracking-[0.42em] text-bone transition-colors duration-500 group-data-[over=light]:text-graphite"
        >
          CRONOS
        </Link>

        <ul className="flex items-center gap-9">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-data text-[0.6875rem] uppercase tracking-[0.18em] text-bone/70 transition-colors duration-300 hover:text-brushed group-data-[over=light]:text-steel group-data-[over=light]:hover:text-graphite"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
