/** Ícones de marca (não incluídos no lucide a partir da v1). */
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.87.24-1.46 1.48-1.46h1.58V4.44A21 21 0 0 0 14.2 4.3c-2.3 0-3.87 1.4-3.87 3.98v2.22H7.7v3h2.63V21h3.17z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.6 7.4a2.6 2.6 0 0 0-1.83-1.84C18.14 5.1 12 5.1 12 5.1s-6.14 0-7.77.46A2.6 2.6 0 0 0 2.4 7.4C2 9.05 2 12 2 12s0 2.95.4 4.6a2.6 2.6 0 0 0 1.83 1.84c1.63.46 7.77.46 7.77.46s6.14 0 7.77-.46a2.6 2.6 0 0 0 1.83-1.84C22 14.95 22 12 22 12s0-2.95-.4-4.6zM10 15.1V8.9L15.2 12 10 15.1z" />
    </svg>
  );
}

export function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 3h-2.9v11.4a2.5 2.5 0 1 1-2.1-2.47V9a5.4 5.4 0 1 0 5 5.38V8.9a6.3 6.3 0 0 0 3.5 1.09V7.05A3.6 3.6 0 0 1 16.5 3z" />
    </svg>
  );
}

export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.34A10 10 0 1 0 12 2zm0 18.1a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.03.8.81-2.95-.19-.31A8.1 8.1 0 1 1 12 20.1zm4.44-6.07c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06a6.6 6.6 0 0 1-1.94-1.2 7.3 7.3 0 0 1-1.34-1.67c-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}
