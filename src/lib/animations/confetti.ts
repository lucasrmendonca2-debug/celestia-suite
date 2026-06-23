import confetti from "canvas-confetti";

const ZENOX_COLORS = ["#F59E0B", "#FBBF24", "#EA580C", "#FCD34D"];

/** Pequeno burst de confete âmbar para celebrar conquistas/equip/compra. */
export function celebrateBurst() {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 35,
    gravity: 0.9,
    ticks: 120,
    colors: ZENOX_COLORS,
    origin: { y: 0.65 },
    scalar: 0.9,
    disableForReducedMotion: true,
  });
}

/** Versão maior para compras de itens lendários/épicos. */
export function celebrateLegendary() {
  if (typeof window === "undefined") return;
  const end = Date.now() + 900;
  const tick = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.7 },
      colors: ZENOX_COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.7 },
      colors: ZENOX_COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(tick);
  };
  tick();
}
