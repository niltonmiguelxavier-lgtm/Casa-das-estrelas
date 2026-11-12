"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal progressivo ao entrar na viewport.
 *
 * Salvaguardas:
 *  - Sem JavaScript o conteúdo é sempre visível (a classe só é aplicada após montagem).
 *  - Se o elemento já estiver na viewport após a montagem, é mostrado imediatamente.
 *  - `prefers-reduced-motion` desactiva a animação (ver globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.05) {
      setVisible(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );
    io.observe(el);

    // Rede de segurança: nunca deixar conteúdo permanentemente oculto.
    const safety = setTimeout(() => setVisible(true), 2500);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);

  return (
    <Tag
      // @ts-expect-error ref polimórfico
      ref={ref}
      className={cn(mounted && !visible && "reveal", visible && "is-visible", className)}
      style={mounted && !visible ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
