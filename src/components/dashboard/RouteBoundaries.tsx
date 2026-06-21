import { useRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="font-display text-xl font-bold text-foreground">
        Não consegui carregar este módulo
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error?.message || "Algo deu errado ao buscar os dados."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Tentar novamente
        </button>
        <Link
          to="/servidores"
          className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-accent/50"
        >
          Meus servidores
        </Link>
      </div>
    </div>
  );
}

export function DashboardNotFound({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="font-display text-xl font-bold text-foreground">
        Conteúdo não encontrado
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {message || "O recurso que você procura não existe ou foi removido."}
      </p>
      <Link
        to="/servidores"
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
      >
        Voltar para meus servidores
      </Link>
    </div>
  );
}
