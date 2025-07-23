
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  comandas: any[];
  produtos: any[];
  totalVendas: number;
  totalItens: number;
  ticketMedio: number;
  produtosMaisVendidos: { produto: any; quantidade: number }[];
}

export const generatePDFReport = async (data: ReportData, selectedDate: string) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProductName = (produtoId: number | null) => {
    if (!produtoId) return 'Prato por Quilo';
    const produto = data.produtos.find(p => p.id === produtoId);
    return produto?.nome || 'Produto não encontrado';
  };

  // Criar um novo PDF
  const pdf = new jsPDF();
  
  // Configurar fonte
  pdf.setFont('helvetica');
  
  // Cabeçalho
  pdf.setFontSize(20);
  pdf.text('🍽️ Relatório de Vendas', 20, 20);
  pdf.setFontSize(12);
  pdf.text(`Restaurante por Quilo`, 20, 30);
  pdf.text(`Data: ${formatDate(selectedDate)}`, 20, 40);
  pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 50);
  
  // Linha separadora
  pdf.setLineWidth(0.5);
  pdf.line(20, 55, 190, 55);
  
  let yPos = 70;
  
  // Resumo
  pdf.setFontSize(16);
  pdf.text('📊 Resumo do Período', 20, yPos);
  yPos += 10;
  
  pdf.setFontSize(12);
  pdf.text(`Total de Vendas: ${data.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
  yPos += 8;
  pdf.text(`Comandas Pagas: ${data.comandas.length}`, 20, yPos);
  yPos += 8;
  pdf.text(`Total de Itens: ${data.totalItens}`, 20, yPos);
  yPos += 8;
  pdf.text(`Ticket Médio: ${data.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, yPos);
  yPos += 15;
  
  // Produtos mais vendidos
  if (data.produtosMaisVendidos.length > 0) {
    pdf.setFontSize(14);
    pdf.text('🏆 Produtos Mais Vendidos', 20, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    data.produtosMaisVendidos.slice(0, 5).forEach((item, index) => {
      pdf.text(`${index + 1}. ${item.produto.nome} - ${item.quantidade} vendidos`, 25, yPos);
      yPos += 6;
    });
    yPos += 10;
  }
  
  // Detalhamento das vendas
  pdf.setFontSize(14);
  pdf.text('📋 Detalhamento das Vendas', 20, yPos);
  yPos += 10;
  
  // Cabeçalho da tabela
  pdf.setFontSize(10);
  pdf.text('Comanda', 20, yPos);
  pdf.text('Data/Hora', 60, yPos);
  pdf.text('Itens', 110, yPos);
  pdf.text('Total', 170, yPos);
  yPos += 5;
  
  // Linha separadora
  pdf.line(20, yPos, 190, yPos);
  yPos += 5;
  
  // Dados das comandas
  data.comandas.forEach((comanda) => {
    // Verificar se precisa de nova página
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }
    
    pdf.text(`#${comanda.identificador_cliente}`, 20, yPos);
    pdf.text(formatDateTime(comanda.data_pagamento), 60, yPos);
    
    // Itens da comanda
    const itensText = comanda.comanda_itens?.map((item: any) => 
      `${getProductName(item.produto_id)} (${item.quantidade}x)`
    ).join(', ') || 'Nenhum item';
    
    // Dividir texto longo em múltiplas linhas
    const maxWidth = 55;
    const splitText = pdf.splitTextToSize(itensText, maxWidth);
    pdf.text(splitText, 110, yPos);
    
    pdf.text((comanda.total || 0).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }), 170, yPos);
    
    yPos += Math.max(6, splitText.length * 4);
  });
  
  // Rodapé
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(`Página ${i} de ${pageCount}`, 170, 285);
    pdf.text('Gerado pelo Sistema PDV - Restaurante por Quilo', 20, 285);
  }
  
  // Salvar o PDF
  const fileName = `relatorio-vendas-${selectedDate}.pdf`;
  pdf.save(fileName);
};
