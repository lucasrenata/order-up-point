import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LowStockProduct } from '@/types/types';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { formatBrazilianDateTime, getCurrentBrazilianDateTime, getCurrentBrazilianDate } from '@/utils/dateUtils';

interface ShoppingListGeneratorProps {
  lowStockProducts: LowStockProduct[];
}

export function ShoppingListGenerator({ lowStockProducts }: ShoppingListGeneratorProps) {
  const generateShoppingListPDF = () => {
    if (lowStockProducts.length === 0) {
      toast.error('Nenhum produto com estoque baixo encontrado');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Cabeçalho
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Lista de Compras - Estoque Baixo', margin, yPosition);
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${formatBrazilianDateTime(getCurrentBrazilianDateTime())}`, margin, yPosition);
      
      yPosition += 20;

      // Cabeçalho da tabela
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Produto', margin, yPosition);
      doc.text('Categoria', margin + 80, yPosition);
      doc.text('Estoque Atual', margin + 120, yPosition);
      doc.text('Sugerido', margin + 160, yPosition);
      
      yPosition += 5;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Produtos
      doc.setFont('helvetica', 'normal');
      lowStockProducts.forEach((item) => {
        const { produto, quantidade_faltante } = item;
        const sugestedQuantity = quantidade_faltante + Math.ceil((produto.estoque_maximo ?? 0) * 0.3);

        if (yPosition > 270) {
          doc.addPage();
          yPosition = 30;
        }

        doc.text(produto.nome.substring(0, 25), margin, yPosition);
        doc.text(produto.categoria, margin + 80, yPosition);
        doc.text(`${produto.estoque_atual}`, margin + 120, yPosition);
        doc.text(`${sugestedQuantity}`, margin + 160, yPosition);
        
        yPosition += 8;
      });

      // Rodapé
      doc.setFontSize(8);
      doc.text(
        `Sistema de PDV Restaurante - ${lowStockProducts.length} produtos`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );

      // Salvar arquivo
      const fileName = `lista-compras-${getCurrentBrazilianDate()}.pdf`;
      doc.save(fileName);
      
      toast.success('Lista de compras gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar lista de compras');
    }
  };

  return (
    <Button
      onClick={generateShoppingListPDF}
      disabled={lowStockProducts.length === 0}
      variant="outline"
      size="sm"
      className="w-full flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      Gerar Lista PDF
    </Button>
  );
}