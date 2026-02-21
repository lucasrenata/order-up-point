
import jsPDF from 'jspdf';
import { formatBrazilianDate, formatBrazilianDateTime } from './dateUtils';

interface ReportData {
  comandas: any[];
  produtos: any[];
  totalVendas: number;
  totalItens: number;
  ticketMedio: number;
  formasPagamento: { forma: string; quantidade: number; icon: string; color: string }[];
  totalDescontos: number;
  totalBruto: number;
  totalLiquido: number;
  comandasComDesconto: number;
  pratoPorQuilo?: number;
  pratoPorQuiloAlmoco?: number;
  pratoPorQuiloJantar?: number;
  totalMarmitex?: number;
  totalMarmitexAlmoco?: number;
  totalMarmitexJantar?: number;
  refeicaoLivre?: number;
  refeicaoLivreAlmoco?: number;
  refeicaoLivreJantar?: number;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Draw a single cell with label + value */
const drawCell = (
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  fill = true
) => {
  if (fill) {
    pdf.setFillColor(245, 245, 245);
    pdf.rect(x, y, w, h, 'FD');
  } else {
    pdf.rect(x, y, w, h, 'S');
  }
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(label, x + 2, y + 5);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 30, 30);
  pdf.text(value, x + 2, y + 12);
};

const drawSummaryBox = (pdf: jsPDF, data: ReportData, startY: number): number => {
  const marginLeft = 15;
  const totalWidth = 180;
  const colW = totalWidth / 4;
  const rowH = 17;
  let y = startY;

  // Title bar
  pdf.setFillColor(60, 60, 60);
  pdf.rect(marginLeft, y, totalWidth, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('RESUMO DO PERIODO', marginLeft + 3, y + 5.5);
  y += 8;

  // Row 1: Faturamento
  drawCell(pdf, marginLeft, y, colW, rowH, 'Faturamento Bruto', formatCurrency(data.totalBruto));
  drawCell(pdf, marginLeft + colW, y, colW, rowH, 'Descontos', `- ${formatCurrency(data.totalDescontos)} (${data.comandasComDesconto})`);
  drawCell(pdf, marginLeft + colW * 2, y, colW, rowH, 'Faturamento Liquido', formatCurrency(data.totalLiquido));
  drawCell(pdf, marginLeft + colW * 3, y, colW, rowH, 'Ticket Medio', formatCurrency(data.ticketMedio));
  y += rowH;

  // Row 2: Vendas gerais
  drawCell(pdf, marginLeft, y, colW, rowH, 'Total Vendas', formatCurrency(data.totalVendas), false);
  drawCell(pdf, marginLeft + colW, y, colW, rowH, 'Comandas Pagas', String(data.comandas.length), false);
  drawCell(pdf, marginLeft + colW * 2, y, colW, rowH, 'Total Itens', String(data.totalItens), false);
  drawCell(pdf, marginLeft + colW * 3, y, colW, rowH, 'Pratos por Quilo', String(data.pratoPorQuilo ?? 0), false);
  y += rowH;

  // Row 3: PQ + Marmitex por período
  drawCell(pdf, marginLeft, y, colW, rowH, 'PQ Almoco', String(data.pratoPorQuiloAlmoco ?? 0));
  drawCell(pdf, marginLeft + colW, y, colW, rowH, 'PQ Jantar', String(data.pratoPorQuiloJantar ?? 0));
  drawCell(pdf, marginLeft + colW * 2, y, colW, rowH, 'Marmitex Almoco', String(data.totalMarmitexAlmoco ?? 0));
  drawCell(pdf, marginLeft + colW * 3, y, colW, rowH, 'Marmitex Jantar', String(data.totalMarmitexJantar ?? 0));
  y += rowH;

  // Row 4: Refeição Livre
  drawCell(pdf, marginLeft, y, colW, rowH, 'Ref. Livre Almoco', String(data.refeicaoLivreAlmoco ?? 0), false);
  drawCell(pdf, marginLeft + colW, y, colW, rowH, 'Ref. Livre Jantar', String(data.refeicaoLivreJantar ?? 0), false);
  drawCell(pdf, marginLeft + colW * 2, y, colW, rowH, 'Total Marmitex', String(data.totalMarmitex ?? 0), false);
  drawCell(pdf, marginLeft + colW * 3, y, colW, rowH, 'Total Ref. Livre', String(data.refeicaoLivre ?? 0), false);
  y += rowH;

  return y;
};

export const generatePDFReport = async (data: ReportData, selectedDate: string) => {
  const getProductName = (produtoId: number | null) => {
    if (!produtoId) return 'Prato por Quilo';
    const produto = data.produtos.find(p => p.id === produtoId);
    return produto?.nome || 'Produto não encontrado';
  };

  const getPaymentMethodDisplay = (comanda: any) => {
    if (comanda.forma_pagamento === 'multiplo' && comanda.pagamentos_divididos) {
      const formas = comanda.pagamentos_divididos.map((p: any) => {
        switch (p.forma_pagamento) {
          case 'dinheiro': return 'Dinheiro';
          case 'pix': return 'Pix';
          case 'debito': return 'Débito';
          case 'credito': return 'Crédito';
          case 'voucher': return 'Voucher';
          default: return 'Desconhecido';
        }
      });
      return formas.join(' + ');
    }
    switch (comanda.forma_pagamento) {
      case 'dinheiro': return 'Dinheiro';
      case 'pix': return 'Pix';
      case 'debito': return 'Débito';
      case 'credito': return 'Crédito';
      case 'voucher': return 'Voucher';
      default: return 'Não informado';
    }
  };

  const pdf = new jsPDF();
  pdf.setFont('helvetica');

  // Header
  pdf.setFontSize(20);
  pdf.text('Relatorio de Vendas', 20, 20);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Restaurante por Quilo', 20, 28);
  pdf.text(`Data: ${formatBrazilianDate(selectedDate + 'T00:00:00Z')}`, 20, 36);
  pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, 20, 44);

  pdf.setLineWidth(0.5);
  pdf.line(15, 48, 195, 48);

  // Summary box
  let yPos = drawSummaryBox(pdf, data, 52);
  yPos += 8;

  // Payment methods
  if (data.formasPagamento.length > 0) {
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text('Formas de Pagamento', 20, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    data.formasPagamento.forEach((item, index) => {
      pdf.text(`${index + 1}. ${item.forma} - ${item.quantidade} comandas`, 25, yPos);
      yPos += 6;
    });
    yPos += 8;
  }

  // Sales detail
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detalhamento das Vendas', 20, yPos);
  yPos += 8;

  // Table header
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Comanda', 20, yPos);
  pdf.text('Data/Hora', 50, yPos);
  pdf.text('Forma Pgto', 90, yPos);
  pdf.text('Itens', 120, yPos);
  pdf.text('Desconto', 152, yPos);
  pdf.text('Total', 178, yPos);
  yPos += 4;
  pdf.setLineWidth(0.3);
  pdf.line(20, yPos, 195, yPos);
  yPos += 5;

  pdf.setFont('helvetica', 'normal');

  data.comandas.forEach((comanda) => {
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(9);
    pdf.text(`#${comanda.identificador_cliente}`, 20, yPos);
    pdf.text(formatBrazilianDateTime(comanda.data_pagamento), 50, yPos);

    const paymentMethod = getPaymentMethodDisplay(comanda);
    pdf.setFontSize(8);
    pdf.text(paymentMethod, 90, yPos);
    pdf.setFontSize(9);

    const itensText = comanda.comanda_itens?.map((item: any) =>
      `${getProductName(item.produto_id)} (${item.quantidade}x)`
    ).join(', ') || 'Nenhum item';

    const maxWidth = 28;
    const splitText = pdf.splitTextToSize(itensText, maxWidth);
    pdf.text(splitText, 120, yPos);

    const descontoText = comanda.desconto && comanda.desconto > 0
      ? `- R$ ${comanda.desconto.toFixed(2)}`
      : '-';
    pdf.text(descontoText, 152, yPos);

    pdf.text(formatCurrency(comanda.total || 0), 178, yPos);

    yPos += Math.max(6, splitText.length * 4);
  });

  // Footer
  const pageCount = (pdf as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Pagina ${i} de ${pageCount}`, 170, 285);
    pdf.text('Sistema PDV - Restaurante por Quilo', 20, 285);
  }

  const fileName = `relatorio-vendas-${selectedDate}.pdf`;
  pdf.save(fileName);
};
