import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  max?: number;
  placeholder?: string;
}

const SNOWFLAKE = /^\d{5,32}$/;

export function SnowflakeChipInput({ value, onChange, max = 50, placeholder = "Cole o ID e pressione Enter" }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const id = draft.trim();
    if (!id) return;
    if (!SNOWFLAKE.test(id)) {
      setError("ID inválido. Use o ID do usuário (apenas dígitos).");
      return;
    }
    if (value.includes(id)) {
      setError("Esse ID já está na lista.");
      return;
    }
    if (value.length >= max) {
      setError(`Limite de ${max} IDs.`);
      return;
    }
    onChange([...value, id]);
    setDraft("");
    setError(null);
  };

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1.5 pr-1 font-mono text-[11px]">
              {id}
              <button
                type="button"
                onClick={() => remove(id)}
                className="ml-1 rounded p-0.5 hover:bg-background"
                aria-label="Remover"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKey}
          placeholder={placeholder}
          className="font-mono text-sm"
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          Adicionar
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
