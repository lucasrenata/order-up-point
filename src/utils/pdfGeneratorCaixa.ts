import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Caixa, CaixaRetirada, CaixaEntrada, CaixaPagamentoReserva, Comanda } from '@/types/types';

export interface DadosFechamentoCaixa {
  caixa: Caixa;
  retiradas: CaixaRetirada[];
  entradas: CaixaEntrada[];
  pagamentosReserva: CaixaPagamentoReserva[];
  comandas: Comanda[];
  vendasPorForma: Record<string, number>;
  totalComandas: number;
  saldoFinal: number;
}

export const generatePDFFechamentoCaixa = async (dados: DadosFechamentoCaixa): Promise<void> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Helper para adicionar nova página se necessário
    const checkPageBreak = (increment: number = 10) => {
      if (y + increment > 280) {
        doc.addPage();
        y = 20;
      }
    };

    // ============= CABEÇALHO =============
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('RELATÓRIO DE FECHAMENTO DE CAIXA', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text(`Caixa ${dados.caixa.numero_caixa} - ${dados.caixa.nome_operador}`, pageWidth / 2, 25, { align: 'center' });

    y = 45;

    // ============= INFORMAÇÕES DO CAIXA =============
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações do Caixa:', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const dataAbertura = dados.caixa.data_abertura 
      ? format(new Date(dados.caixa.data_abertura), 'dd/MM/yyyy HH:mm')
      : 'N/A';
    const dataFechamento = dados.caixa.data_fechamento 
      ? format(new Date(dados.caixa.data_fechamento), 'dd/MM/yyyy HH:mm')
      : format(new Date(), 'dd/MM/yyyy HH:mm');

    doc.text(`Data/Hora Abertura: ${dataAbertura}`, 14, y);
    y += 6;
    doc.text(`Data/Hora Fechamento: ${dataFechamento}`, 14, y);
    y += 6;
    doc.text(`Valor de Abertura: R$ ${dados.caixa.valor_abertura.toFixed(2)}`, 14, y);
    y += 10;

    // ============= RESUMO FINANCEIRO =============
    checkPageBreak(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
    doc.text('Resumo Financeiro', 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Vendas por forma de pagamento
    doc.text('Vendas (Comandas):', 14, y);
    y += 6;
    doc.text(`  Dinheiro: R$ ${(dados.vendasPorForma.dinheiro || 0).toFixed(2)}`, 20, y);
    y += 5;
    doc.text(`  PIX: R$ ${(dados.vendasPorForma.pix || 0).toFixed(2)}`, 20, y);
    y += 5;
    doc.text(`  Débito: R$ ${(dados.vendasPorForma.debito || 0).toFixed(2)}`, 20, y);
    y += 5;
    doc.text(`  Crédito: R$ ${(dados.vendasPorForma.credito || 0).toFixed(2)}`, 20, y);
    y += 5;
    doc.text(`  Voucher: R$ ${(dados.vendasPorForma.voucher || 0).toFixed(2)}`, 20, y);
    y += 7;

    const totalVendas = Object.values(dados.vendasPorForma).reduce((acc, val) => acc + val, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Vendas: R$ ${totalVendas.toFixed(2)}`, 14, y);
    doc.setFont('helvetica', 'normal');
    y += 7;

    // Pagamentos de reserva
    const totalReservas = dados.pagamentosReserva.reduce((acc, p) => acc + p.valor, 0);
    doc.text(`Pagamentos de Reserva: R$ ${totalReservas.toFixed(2)}`, 14, y);
    y += 6;

    // Entradas
    const totalEntradas = dados.entradas.reduce((acc, e) => acc + e.valor, 0);
    doc.text(`Entradas: R$ ${totalEntradas.toFixed(2)}`, 14, y);
    y += 6;

    // Retiradas
    const totalRetiradas = dados.retiradas.reduce((acc, r) => acc + r.valor, 0);
    doc.text(`Retiradas: R$ (${totalRetiradas.toFixed(2)})`, 14, y);
    y += 8;

    // Saldo final
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setDrawColor(0, 0, 0);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
    doc.text(`SALDO FINAL: R$ ${dados.saldoFinal.toFixed(2)}`, 14, y);
    y += 10;

    // ============= COMANDAS PROCESSADAS =============
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
    doc.text(`Comandas Processadas (${dados.totalComandas})`, 14, y);
    y += 10;

    if (dados.comandas.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Nenhuma comanda processada neste caixa', 14, y);
      y += 10;
    } else {
      // Cabeçalho da tabela
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Cliente', 14, y);
      doc.text('Hora', 60, y);
      doc.text('Itens', 85, y);
      doc.text('Total', 105, y);
      doc.text('Pagamento', 135, y);
      y += 5;
      doc.line(14, y, pageWidth - 14, y);
      y += 5;

      // Dados das comandas
      doc.setFont('helvetica', 'normal');
      dados.comandas.forEach((comanda) => {
        checkPageBreak(8);
        
        const hora = comanda.data_pagamento 
          ? format(new Date(comanda.data_pagamento), 'HH:mm')
          : '--:--';
        const numItens = comanda.comanda_itens?.length || 0;
        const total = `R$ ${(comanda.total || 0).toFixed(2)}`;
        
        let pagamento = '';
        if (comanda.forma_pagamento === 'multiplo') {
          pagamento = 'Múltiplo';
        } else {
          const formaMap: Record<string, string> = {
            dinheiro: 'Dinheiro',
            pix: 'PIX',
            debito: 'Débito',
            credito: 'Crédito',
            voucher: 'Voucher',
          };
          pagamento = formaMap[comanda.forma_pagamento || ''] || comanda.forma_pagamento || '';
        }

        doc.text(comanda.identificador_cliente.substring(0, 15), 14, y);
        doc.text(hora, 60, y);
        doc.text(numItens.toString(), 85, y);
        doc.text(total, 105, y);
        doc.text(pagamento, 135, y);
        y += 5;
      });

      y += 5;
    }

    // ============= RETIRADAS =============
    if (dados.retiradas.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
      doc.text(`Retiradas (${dados.retiradas.length})`, 14, y);
      y += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      dados.retiradas.forEach((retirada) => {
        checkPageBreak(10);
        const hora = format(new Date(retirada.data_retirada), 'dd/MM/yyyy HH:mm');
        doc.text(`${hora} - R$ ${retirada.valor.toFixed(2)}`, 14, y);
        y += 5;
        if (retirada.observacao) {
          doc.setFont('helvetica', 'italic');
          doc.text(`  "${retirada.observacao}"`, 20, y);
          doc.setFont('helvetica', 'normal');
          y += 5;
        }
      });
      y += 5;
    }

    // ============= ENTRADAS =============
    if (dados.entradas.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
      doc.text(`Entradas (${dados.entradas.length})`, 14, y);
      y += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      dados.entradas.forEach((entrada) => {
        checkPageBreak(10);
        const hora = format(new Date(entrada.data_entrada), 'dd/MM/yyyy HH:mm');
        doc.text(`${hora} - R$ ${entrada.valor.toFixed(2)}`, 14, y);
        y += 5;
        if (entrada.observacao) {
          doc.setFont('helvetica', 'italic');
          doc.text(`  "${entrada.observacao}"`, 20, y);
          doc.setFont('helvetica', 'normal');
          y += 5;
        }
      });
      y += 5;
    }

    // ============= PAGAMENTOS DE RESERVA =============
    if (dados.pagamentosReserva.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
      doc.text(`Pagamentos de Reserva (${dados.pagamentosReserva.length})`, 14, y);
      y += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      dados.pagamentosReserva.forEach((pagamento) => {
        checkPageBreak(10);
        const hora = format(new Date(pagamento.data_pagamento), 'dd/MM/yyyy HH:mm');
        const formaMap: Record<string, string> = {
          dinheiro: 'Dinheiro',
          pix: 'PIX',
          debito: 'Débito',
          credito: 'Crédito',
          voucher: 'Voucher',
        };
        const forma = formaMap[pagamento.forma_pagamento];
        doc.text(`${pagamento.cliente_nome} - R$ ${pagamento.valor.toFixed(2)} (${forma})`, 14, y);
        y += 5;
        if (pagamento.observacao) {
          doc.setFont('helvetica', 'italic');
          doc.text(`  "${pagamento.observacao}"`, 20, y);
          doc.setFont('helvetica', 'normal');
          y += 5;
        }
      });
      y += 5;
    }

    // ============= RODAPÉ =============
    checkPageBreak(20);
    doc.setDrawColor(0, 0, 0);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Operador: ________________________________________', 14, y);
    y += 10;
    doc.setFont('helvetica', 'italic');
    doc.text(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, y);
    y += 5;
    doc.text('Sistema: Parceria Com IA', 14, y);

    // ============= SALVAR PDF =============
    const dataFormatada = format(new Date(), 'dd-MM-yyyy_HHhmm');
    const nomeArquivo = `Fechamento_Caixa_${dados.caixa.numero_caixa}_${dataFormatada}.pdf`;
    doc.save(nomeArquivo);

  } catch (error: any) {
    console.error('Erro ao gerar PDF de fechamento:', error);
    throw new Error('Erro ao gerar PDF de fechamento: ' + error.message);
  }
};
