

## Adicionar Quadro de Resumo no Topo do PDF de Relatório de Vendas

### Objetivo
Incluir no PDF de vendas (`src/utils/pdfGenerator.ts`) todas as informações que aparecem nos cards da tela de relatórios: faturamento, descontos, comandas, itens, ticket médio, pratos por quilo (almoço/jantar), marmitex (almoço/jantar) e refeição livre (almoço/jantar).

### Arquivo a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/utils/pdfGenerator.ts` | Atualizar interface `ReportData` e adicionar quadro visual no topo do PDF |

### Detalhes Técnicos

#### 1. Atualizar a interface `ReportData`

Adicionar os campos que faltam para receber os dados dos cards:
- `pratoPorQuilo`, `pratoPorQuiloAlmoco`, `pratoPorQuiloJantar`
- `totalMarmitex`, `totalMarmitexAlmoco`, `totalMarmitexJantar`
- `refeicaoLivre`, `refeicaoLivreAlmoco`, `refeicaoLivreJantar`

#### 2. Criar quadro visual no PDF

Após o cabeçalho (título, data, etc.), desenhar um bloco de resumo organizado em seções usando retângulos com `pdf.rect()` e texto organizado:

```text
┌──────────────────────────────────────────────────────────────┐
│  RESUMO DO PERIODO                                          │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Fat. Bruto   │ Descontos    │ Fat. Líquido │                │
│ R$ X.XXX,XX  │ R$ XXX,XX    │ R$ X.XXX,XX  │                │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ Total Vendas │ Comandas     │ Total Itens  │ Ticket Medio   │
│ R$ X.XXX,XX  │ XX           │ XX           │ R$ XX,XX       │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ Almoco PQ    │ Jantar PQ    │ Marmitex Alm │ Marmitex Jan   │
│ XX           │ XX           │ XX           │ XX             │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ Ref.Livre Alm│ Ref.Livre Jan│              │                │
│ XX           │ XX           │              │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

Cada "célula" será desenhada com:
- `pdf.rect(x, y, w, h)` para bordas
- `pdf.setFontSize(8)` para rótulos (ex: "Faturamento Bruto")
- `pdf.setFontSize(12)` + bold para valores (ex: "R$ 1.500,00")
- Fundo cinza claro (`pdf.setFillColor(245, 245, 245)`) para destaque visual

#### 3. Reposicionar conteúdo existente

O resumo em formato texto atual (linhas 69-85) será substituído pelo quadro visual. O restante do PDF (formas de pagamento, detalhamento das vendas) continua abaixo com `yPos` ajustado.

### Resultado Esperado

O PDF terá no topo, logo após o cabeçalho, um quadro visual organizado com todas as métricas que aparecem na tela de relatórios, espelhando os cards vistos na imagem de referência.

