"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, initGsap, prefersReducedMotion } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Atraso em segundos — para escalonar irmãos numa mesma entrada. */
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "header";
};

/**
 * Entrada com timing de tick, disparada pelo scroll.
 * O conteúdo já existe no DOM e no HTML servido — apenas a opacidade é
 * animada, então o texto continua indexável e legível sem JS.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.classList.add("is-in");
      return;
    }

    initGsap();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay,
          ease: "tick",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [delay]);

  const Tag = as;
  return (
    <Tag ref={ref as never} className={`reveal ${className ?? ""}`}>
      {children}
    </Tag>
  );
}

export { ScrollTrigger };
