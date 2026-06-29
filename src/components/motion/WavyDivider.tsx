import { motion } from "framer-motion";

/** Onda SVG animada usada como divisor de seção. */
export function WavyDivider({
  color = "#1B0E3B",
  flip = false,
  height = 60,
  className,
}: {
  color?: string;
  flip?: boolean;
  height?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none w-full overflow-hidden leading-[0] ${className ?? ""}`}
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ width: "100%", height }}
      >
        <motion.path
          fill={color}
          initial={{ d: "M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z" }}
          animate={{
            d: [
              "M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z",
              "M0,70 C240,110 480,30 720,70 C960,110 1200,30 1440,70 L1440,120 L0,120 Z",
              "M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
