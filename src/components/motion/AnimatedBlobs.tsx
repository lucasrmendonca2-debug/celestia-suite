import { motion, useReducedMotion } from "framer-motion";

/**
 * Blobs animados em background — versão melhorada do BgBlobs original.
 * Mantém a paleta (#EC4899/#7C3AED/#FBBF24/#10D9A0) e adiciona drift suave.
 */
export function AnimatedBlobs() {
  const reduce = useReducedMotion();
  const baseTransition = { repeat: Infinity, ease: "easeInOut" as const };
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-20 -z-10 size-[500px] rounded-full bg-[#EC4899]/20 blur-[120px]"
        animate={
          reduce
            ? undefined
            : { x: [0, -40, 20, 0], y: [0, 30, -20, 0], scale: [1, 1.08, 0.95, 1] }
        }
        transition={{ ...baseTransition, duration: 18 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[40%] -z-10 size-[500px] rounded-full bg-[#7C3AED]/20 blur-[120px]"
        animate={
          reduce
            ? undefined
            : { x: [0, 50, -20, 0], y: [0, -40, 30, 0], scale: [1, 0.95, 1.1, 1] }
        }
        transition={{ ...baseTransition, duration: 22 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[20%] top-[80%] -z-10 size-[400px] rounded-full bg-[#FBBF24]/20 blur-[110px]"
        animate={
          reduce
            ? undefined
            : { x: [0, -30, 40, 0], y: [0, 25, -35, 0], scale: [1, 1.05, 0.92, 1] }
        }
        transition={{ ...baseTransition, duration: 20 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[35%] top-[15%] -z-10 size-[320px] rounded-full bg-[#10D9A0]/15 blur-[100px]"
        animate={
          reduce
            ? undefined
            : { x: [0, 35, -25, 0], y: [0, -20, 30, 0], scale: [1, 1.1, 0.95, 1] }
        }
        transition={{ ...baseTransition, duration: 24 }}
      />
    </>
  );
}
