import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import zenoxMascot from "@/assets/zenox-mascot.png.asset.json";

const links = [
  { to: "/comandos", label: "Comandos" },
  { to: "/recursos", label: "Recursos" },
  { to: "/premium", label: "Premium" },
  { to: "/status", label: "Status" },
  { to: "/docs", label: "Docs" },
  { to: "/suporte", label: "Suporte" },
] as const;

export function ZenoxWordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white pl-1.5 pr-4 py-1.5 shadow-[0_4px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5 ${className}`}
    >
      <span className="relative inline-flex size-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#A855F7] to-[#EC4899] font-['Plus_Jakarta_Sans'] text-lg font-extrabold text-white shadow-inner">
        <img loading="lazy" decoding="async"
          src={zenoxMascot.url}
          alt=""
          className="absolute inset-0 size-full scale-110 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="relative drop-shadow-[0_1px_0_rgba(0,0,0,0.25)] transition-opacity group-hover:opacity-0">Z</span>
      </span>
      <span className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold tracking-tight text-[#1B0E3B]">
        Zenox
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#1B0E3B]/5 bg-[#FBF7FF]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <ZenoxWordmark />

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-2 text-sm font-semibold text-[#5B4B7A] transition-colors hover:bg-white hover:text-[#7C3AED]"
              activeProps={{ className: "bg-white text-[#7C3AED] shadow-sm" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/api/auth/discord/login"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/api/auth/discord/login?origin=${encodeURIComponent(window.location.origin)}`;
            }}
            className="hidden rounded-full border-2 border-[#1B0E3B] bg-white px-4 py-2 text-sm font-bold text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            Entrar
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-full border-2 border-[#1B0E3B] bg-white text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B] lg:hidden"
            aria-label="Abrir menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#1B0E3B]/10 bg-white/95 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[#1B0E3B] hover:bg-[#F1E9FF]"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="/api/auth/discord/login"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                window.location.href = `/api/auth/discord/login?origin=${encodeURIComponent(window.location.origin)}`;
              }}
              className="mt-2 rounded-xl bg-[#1B0E3B] px-3 py-2 text-center text-sm font-bold text-white"
            >
              Entrar
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-dashed border-[#1B0E3B]/15 bg-[#FBF7FF] px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <ZenoxWordmark />
          <p className="max-w-sm text-sm leading-relaxed text-[#5B4B7A]">
            O bot brasileiro para comunidades Discord que querem mais diversão, organização e
            personalidade — sem complicação e sem mensalidade obrigatória.
          </p>
        </div>
        <FooterCol
          title="Produto"
          links={[
            { to: "/comandos", label: "Comandos" },
            { to: "/recursos", label: "Recursos" },
            { to: "/premium", label: "Premium" },
            { to: "/status", label: "Status" },
          ]}
        />
        <FooterCol
          title="Comunidade"
          links={[
            { to: "/docs", label: "Documentação" },
            { to: "/suporte", label: "Suporte" },
            { to: "/servidores", label: "Dashboard" },
          ]}
        />
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-[#1B0E3B]/10 pt-6 text-center text-xs font-semibold uppercase tracking-widest text-[#5B4B7A]/70">
        © {new Date().getFullYear()} Zenox · feito com carinho no Brasil
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links: items,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#1B0E3B]">{title}</h4>
      <ul className="space-y-2 text-sm text-[#5B4B7A]">
        {items.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="transition-colors hover:text-[#7C3AED]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
