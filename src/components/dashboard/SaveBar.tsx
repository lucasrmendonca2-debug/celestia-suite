import { Check, Loader2, RotateCcw, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  dirty: boolean;
  isPending: boolean;
  isSuccess?: boolean;
  errorMessage?: string | null;
  onSave: () => void;
  onReset: () => void;
}

export function SaveBar({
  dirty,
  isPending,
  isSuccess,
  errorMessage,
  onSave,
  onReset,
}: Props) {
  const visible = dirty || isPending || !!errorMessage;
  if (!visible) return null;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 bottom-4 z-40 px-4"
        >
          <div
            className={cn(
              "mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border bg-card/95 px-4 py-2.5 shadow-2xl backdrop-blur",
              errorMessage ? "border-destructive/40" : "border-border",
            )}
          >
            <div className="flex items-center gap-2 text-sm">
              {errorMessage ? (
                <>
                  <AlertTriangle className="size-4 text-destructive" />
                  <span className="text-destructive">{errorMessage}</span>
                </>
              ) : isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">Salvando…</span>
                </>
              ) : isSuccess && !dirty ? (
                <>
                  <Check className="size-4 text-emerald-500" />
                  <span className="text-muted-foreground">Tudo salvo.</span>
                </>
              ) : (
                <>
                  <span className="inline-block size-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">
                    Você tem alterações não salvas.
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={isPending || !dirty}
              >
                <RotateCcw className="mr-1.5 size-3.5" /> Desfazer
              </Button>
              <Button size="sm" onClick={onSave} disabled={isPending || !dirty}>
                <Save className="mr-1.5 size-3.5" />
                {isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
