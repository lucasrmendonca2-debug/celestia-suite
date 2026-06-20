import { useId } from "react";
import hero from "@/assets/mascot-hero.png.asset.json";
import error from "@/assets/mascot-error.png.asset.json";
import notFound from "@/assets/mascot-404.png.asset.json";
import sleeping from "@/assets/mascot-sleeping.png.asset.json";
import celebrate from "@/assets/mascot-celebrate.png.asset.json";
import loading from "@/assets/mascot-loading.png.asset.json";
import original from "@/assets/zenox-mascot.png.asset.json";

const SOURCES = {
  hero,
  error,
  "404": notFound,
  sleeping,
  celebrate,
  loading,
  original,
} as const;

export type MascotVariant = keyof typeof SOURCES;

interface MascotProps {
  variant?: MascotVariant;
  size?: number;
  className?: string;
  /** Wrap in a floating glow ring */
  glow?: boolean;
  alt?: string;
}

export function Mascot({
  variant = "hero",
  size = 96,
  className = "",
  glow = false,
  alt = "Zenox",
}: MascotProps) {
  const src = SOURCES[variant].url;
  const id = useId();

  return (
    <div
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-70"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--aurora-pink) 60%, transparent), transparent 70%)",
          }}
          id={id}
        />
      )}
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="size-full object-contain drop-shadow-[0_8px_24px_color-mix(in_oklab,var(--aurora-lavender)_60%,transparent)]"
        loading="lazy"
      />
    </div>
  );
}

/**
 * Mascote que sai espiando de trás ao hover.
 * Coloque dentro de um container relative com a classe `mascot-peek-trigger`.
 */
export function MascotPeek({ size = 84 }: { size?: number }) {
  return (
    <div
      className="mascot-peek pointer-events-none absolute -left-4 bottom-0 z-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <img
        src={SOURCES.hero.url}
        alt=""
        className="size-full object-contain object-bottom"
      />
    </div>
  );
}
