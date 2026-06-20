import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";


function NotFoundComponent() {
  return (
    <div className="aurora-shell flex min-h-screen items-center justify-center px-4">
      <div className="relative z-10 max-w-md text-center">
        <div className="mb-2 flex justify-center">
          <Mascot variant="404" size={140} glow />
        </div>
        <h1 className="font-display text-8xl font-black aurora-text">404</h1>
        <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
          Página perdida no espaço
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura sumiu — ou nunca existiu.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Voltar pra home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="aurora-shell flex min-h-screen items-center justify-center px-4">
      <div className="relative z-10 max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Essa página tropeçou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar de novo ou voltar pra home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card/60 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-accent/50"
          >
            Voltar pra home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Zenox Bot" },
      { name: "description", content: "O bot mais completo para sua comunidade!" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Zenox Bot" },
      { property: "og:description", content: "O bot mais completo para sua comunidade!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Zenox Bot" },
      { name: "twitter:description", content: "O bot mais completo para sua comunidade!" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5a14413a-b33b-4522-aa1b-9bc2adf28904/id-preview-87e3ff04--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app-1781961690722.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5a14413a-b33b-4522-aa1b-9bc2adf28904/id-preview-87e3ff04--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app-1781961690722.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('zenox-theme')||'dark';if(t!=='dark')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

