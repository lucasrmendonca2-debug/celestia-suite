import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Marquee infinito — duplica children e desliza com transform.
 * Mantém o vibe playful sem CSS animations puras.
 */
export function Marquee({
  children,
  speed = 40,
  direction = "left",
  pauseOnHover = false,
  className,
}: {
  children: ReactNode;
  speed?: number; // segundos para um loop completo
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const x = direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"];
  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="flex w-max gap-6"
        animate={reduce ? undefined : { x }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
        whileHover={pauseOnHover ? { x } : undefined}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
