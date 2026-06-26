## Polimento UX — Moderação

Mesmo padrão da Tickets, agora no módulo de Moderação.

### Escopo

1. **Skeletons compartilhados** — `src/components/dashboard/moderation/_skeletons.tsx`
   - `CasesTableSkeleton` (linhas/colunas do histórico)
   - `BlacklistSkeleton` (chips placeholder)
   - `StatsSkeleton` (3 cards aurora)

2. **HistoryTab.tsx**
   - Trocar render condicional sem loader por `CasesTableSkeleton` enquanto `query.isLoading`.
   - Empty state com `Mascot` (variant `sleeping`) + copy "Sem registros — servidor calmo".
   - Substituir botão de invalidar caso por `AlertDialog` shadcn ("Marcar caso como inativo? Esta ação registra a edição mas mantém o histórico.") em vez do clique seco que dispara mutação imediata.
   - Mostrar `Loader2` no botão de salvar do diálogo de editar motivo enquanto `editMut.isPending`.
   - Adicionar `aria-label` nos botões ghost de Editar/Invalidar.

3. **AutomodTab.tsx**
   - Empty state da blacklist com mascote (variant `hero`, size 56) + copy curta em vez do texto italic atual.
   - Skeleton ao montar a aba (enquanto fetch inicial não resolveu via loader; usar `useIsFetching` chave automod).
   - Confirmar via `AlertDialog` antes de "Resetar configurações" se existir; senão, manter.
   - Adicionar `<Dialog>` para edição de listas longas (canais ignorados, cargos ignorados) apenas se hoje for inline e estourar — checar antes de implementar.

4. **Rota `dashboard.$slug.moderacao.tsx`**
   - Verificar que `errorComponent` usa `useRouter().invalidate()` + `reset()` (atualmente só mostra mensagem). Adicionar botão "Tentar novamente".
   - Banner hero: manter, só ajustar pluralização ("punições"/"punição") para evitar o atual "puniçãoões" quando `active>1`.
   - `notFoundComponent` ganha mascote `sleeping` em vez de texto puro.

5. **A11y / consistência**
   - Todos botões icon-only ganham `aria-label`.
   - Inputs de filtro do histórico recebem `<Label>` (sr-only) associada.
   - Badges de ação no histórico passam a usar `role="status"` para leitores de tela.

### Fora de escopo

- Mudanças de lógica de negócio (RPCs, permissões, fluxos do bot).
- Refatoração visual ampla do AutoMod (apenas empty states + skeletons).
- Novas features.

### Validação

`tsgo` no fim para garantir zero regressão de tipos.

### Próxima área após esta

Economia + Loja **ou** Premium + Perfil + Servidores — confirmar ao terminar.
