
## Plano de Correção: Deletar Registro do Caixa Após Fechamento

### Problema Identificado

Quando o caixa é fechado, o sistema apenas atualiza o `status` para 'fechado', mas **não deleta o registro** da tabela `caixas`. Isso causa:

1. Ao buscar caixas (`fetchCaixas`), o sistema encontra o registro fechado como "mais recente"
2. O caixa aparece como "Fechado" em vez de estar disponível para abrir novamente
3. Acumulação de registros antigos na tabela `caixas`

### Fluxo Atual vs Esperado

```text
ATUAL:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Fechar Caixa    │ --> │ Gerar PDF       │ --> │ status='fechado'│
│                 │     │                 │     │ (registro fica) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        v
                                               Caixa aparece fechado

ESPERADO:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Fechar Caixa    │ --> │ Gerar PDF       │ --> │ DELETE registro │
│                 │     │                 │     │ da tabela caixas│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        v
                                               Caixa disponível para abrir
```

---

### Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/hooks/useGerenciamentoCaixa.ts` | Criar função `deletarRegistroCaixa` para deletar o registro do caixa da tabela `caixas` |
| `src/components/CaixaModal.tsx` | Atualizar `handleConfirmarFechamento` para deletar o registro após gerar o PDF |

---

### Detalhes Técnicos

#### 1. Nova função no hook (`useGerenciamentoCaixa.ts`)

Criar `deletarRegistroCaixa(caixaId)` que:
- Deleta o registro específico da tabela `caixas` por ID
- Retorna erro se falhar

#### 2. Atualizar `handleConfirmarFechamento` (`CaixaModal.tsx`)

Após gerar o PDF e antes de atualizar a view:
1. Manter `fecharCaixa()` (atualiza status - necessário para consistência dos dados de vendas)
2. Adicionar chamada para `deletarRegistroCaixa()` para remover o registro da tabela caixas
3. Isso libera o caixa para ser aberto novamente

---

### Comportamento Esperado Após Correção

1. Usuário clica em "Fechar Caixa"
2. Sistema gera PDF de fechamento
3. Sistema atualiza status do caixa para 'fechado' (dados de vendas mantidos por 7 dias)
4. Sistema deleta o registro do caixa da tabela `caixas`
5. Ao reabrir o modal de caixas, o caixa aparece disponível para abrir

---

### Nota Importante

Os dados de vendas (comandas, itens, retiradas, entradas, pagamentos de reserva) continuam **mantidos por 7 dias** conforme o requisito existente. O que será deletado é apenas o **registro do operador/caixa** na tabela `caixas`, permitindo que outro operador abra um novo turno naquele caixa.
