"use client";

import { useEffect, useState } from "react";

/**
 * Data/hora renderizada apenas no cliente.
 * Evita divergências de hidratação entre o relógio do servidor e do browser.
 */
export function LocalDateTime({
  value,
  options = { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" },
  className,
}: {
  value?: string | Date;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}) {
  const format = (d: Date) =>
    new Intl.DateTimeFormat("pt-MZ", { timeZone: "Africa/Maputo", ...options }).format(d);

  // Com um valor absoluto a formatação é determinística (fuso fixo) e pode ser
  // renderizada no servidor. Sem valor (relógio actual) só o cliente formata,
  // para não divergir entre servidor e browser.
  const [text, setText] = useState<string>(() => (value ? format(new Date(value)) : ""));

  useEffect(() => {
    setText(format(value ? new Date(value) : new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, JSON.stringify(options)]);

  return (
    <span className={className} suppressHydrationWarning>
      {text || "—"}
    </span>
  );
}
