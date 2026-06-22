import { createFileRoute } from "@tanstack/react-router";

// Importa todos os .asset.json gerados em src/assets/cosmetics/
const modules = import.meta.glob<{ default: { url: string; original_filename: string } }>(
  "../assets/cosmetics/*.asset.json",
  { eager: true },
);

const items = Object.entries(modules)
  .map(([path, mod]) => ({
    path,
    name: mod.default.original_filename.replace(/\.png$/, ""),
    url: mod.default.url,
    kind: mod.default.original_filename.split("-")[0],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const Route = createFileRoute("/cosmetics-preview")({
  component: CosmeticsPreview,
  head: () => ({ meta: [{ title: "Preview cosméticos" }] }),
});

function CosmeticsPreview() {
  const banners = items.filter((i) => i.kind === "banner");
  const frames = items.filter((i) => i.kind === "frame");
  const stickers = items.filter((i) => i.kind === "sticker");

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-7xl space-y-12">
        <header>
          <h1 className="text-3xl font-bold">Preview — Coleção inicial</h1>
          <p className="text-muted-foreground">
            Total: {items.length} / 150 · Banners {banners.length}/50 · Frames {frames.length}/50 · Stickers {stickers.length}/50
          </p>
        </header>

        <Section title={`Banners (${banners.length})`} items={banners} aspect="aspect-[3/1]" />
        <Section title={`Frames (${frames.length})`} items={frames} aspect="aspect-square" />
        <Section title={`Stickers (${stickers.length})`} items={stickers} aspect="aspect-square" />
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  aspect,
}: {
  title: string;
  items: { name: string; url: string }[];
  aspect: string;
}) {
  if (items.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">Nenhum gerado ainda.</p>
      </section>
    );
  }
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <figure key={i.name} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className={`${aspect} w-full overflow-hidden bg-muted`}>
              <img src={i.url} alt={i.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <figcaption className="px-3 py-2 text-xs text-muted-foreground">{i.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
