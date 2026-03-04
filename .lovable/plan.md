

## Plano: Tornar o App Completamente Responsivo

### Principio Guia
Ajustes incrementais e conservadores -- apenas modificar classes Tailwind existentes e layout, sem alterar logica de negocio, estado ou funcoes.

### Problemas Identificados

1. **Index.tsx (PDV principal)** -- Problema principal
   - Header: botoes "Caixa", "Modo Multiplo", "Estoque", "Relatorio" ficam apertados/cortados em telas pequenas (visivel na imagem enviada)
   - Input de comanda com largura fixa `md:w-96`
   - Grid principal `lg:grid-cols-2` com `height: calc(100vh - 180px)` fixo -- em mobile, a segunda coluna fica escondida ou precisa scroll
   - Botoes do header com `py-3 px-6` sao grandes demais para mobile

2. **StockPage.tsx**
   - Header com `flex items-center justify-between` -- titulo e botoes ficam na mesma linha sem quebra em telas pequenas
   - Titulo `text-3xl` muito grande em mobile
   - Stats cards `md:grid-cols-4` -- ok, mas os valores podem ficar apertados

3. **ReportSummary.tsx**
   - Cards ja tem alguma responsividade mas a grid `grid-cols-2 md:grid-cols-4 lg:grid-cols-5` pode ser melhorada
   - Formas de pagamento `md:grid-cols-4` sem fallback para 2 colunas

4. **PaymentModal.tsx e CaixaModal.tsx** (854 e 894 linhas)
   - Modais grandes que precisam de scroll adequado em mobile
   - Precisam ser verificados mais a fundo, mas como usam Dialog do Radix, ja tem alguma responsividade

5. **ReportTable.tsx / MovimentacoesTab.tsx**
   - Tabelas precisam de overflow-x-auto para scroll horizontal em mobile

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Index.tsx` | Reorganizar header para empilhar em mobile; remover altura fixa do grid; ajustar tamanhos de botoes e input |
| `src/pages/StockPage.tsx` | Empilhar header em mobile; reduzir titulo; wrap nos botoes |
| `src/components/ReportSummary.tsx` | Ajustar grid de formas de pagamento para `grid-cols-2 md:grid-cols-4` |
| `src/components/ReportTable.tsx` | Adicionar `overflow-x-auto` no container da tabela |
| `src/components/MovimentacoesTab.tsx` | Verificar e ajustar cards de movimentacoes para mobile |
| `src/components/PaymentModal.tsx` | Ajustar padding e tamanhos de botoes de pagamento para telas pequenas |

### Detalhes por Arquivo

**Index.tsx (mudanca principal):**
- Header: mudar de `flex-row` para coluna em mobile, com botoes em grid `grid-cols-2` em mobile
- Input comanda: `w-full` em todas as telas (remover `md:w-96`)
- Grid principal: remover `style={{ height: 'calc(100vh - 180px)' }}` e usar `min-h-0` + auto height em mobile
- Botoes: reduzir para `py-2 px-3 text-sm` em mobile, manter tamanho atual em `sm:`

**StockPage.tsx:**
- Header: `flex-col sm:flex-row` com gap
- Titulo: `text-xl sm:text-3xl`
- Botoes: wrap com `flex-wrap`

**PaymentModal.tsx:**
- Botoes de forma de pagamento: `grid-cols-2 sm:grid-cols-3` em vez de layout fixo
- Padding reduzido em mobile

### Abordagem de Seguranca
- Apenas classes Tailwind serao alteradas (responsividade)
- Nenhuma logica de estado, evento ou funcao sera modificada
- Cada componente sera testado isoladamente
- Uso exclusivo de breakpoints Tailwind (`sm:`, `md:`, `lg:`) ja existentes no projeto

