
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Printer, Calendar, TrendingUp, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ReportSummary } from '../components/ReportSummary';
import { ReportTable } from '../components/ReportTable';
import { ReportFilters } from '../components/ReportFilters';
import { generatePDFReport } from '../utils/pdfGenerator';
import { Comanda, ComandaItem, Product } from '../types/types';

interface ReportData {
  comandas: Comanda[];
  produtos: Product[];
  totalVendas: number;
  totalItens: number;
  ticketMedio: number;
  produtosMaisVendidos: { produto: Product; quantidade: number }[];
}

export default function ReportPage() {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReportData = async (date: string) => {
    setIsLoading(true);
    try {
      const startDate = `${date}T00:00:00.000Z`;
      const endDate = `${date}T23:59:59.999Z`;

      // Buscar comandas pagas do dia
      const { data: comandas, error: comandasError } = await supabase
        .from('comandas')
        .select(`
          *,
          comanda_itens (
            id,
            created_at,
            comanda_id,
            produto_id,
            quantidade,
            preco_unitario,
            descricao
          )
        `)
        .eq('status', 'paga')
        .gte('data_pagamento', startDate)
        .lte('data_pagamento', endDate)
        .order('data_pagamento', { ascending: false });

      if (comandasError) throw comandasError;

      // Buscar produtos
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('*');

      if (produtosError) throw produtosError;

      // Calcular estatísticas
      const totalVendas = comandas?.reduce((sum, comanda) => sum + (comanda.total || 0), 0) || 0;
      const totalItens = comandas?.reduce((sum, comanda) => 
        sum + (comanda.comanda_itens?.reduce((itemSum, item) => itemSum + item.quantidade, 0) || 0), 0) || 0;
      const ticketMedio = comandas?.length ? totalVendas / comandas.length : 0;

      // Calcular produtos mais vendidos
      const produtoQuantidades: { [key: number]: number } = {};
      comandas?.forEach(comanda => {
        comanda.comanda_itens?.forEach(item => {
          if (item.produto_id) {
            produtoQuantidades[item.produto_id] = (produtoQuantidades[item.produto_id] || 0) + item.quantidade;
          }
        });
      });

      const produtosMaisVendidos = Object.entries(produtoQuantidades)
        .map(([produtoId, quantidade]) => ({
          produto: produtos?.find(p => p.id === parseInt(produtoId)),
          quantidade
        }))
        .filter(item => item.produto)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5) as { produto: Product; quantidade: number }[];

      setReportData({
        comandas: comandas || [],
        produtos: produtos || [],
        totalVendas,
        totalItens,
        ticketMedio,
        produtosMaisVendidos
      });
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      toast.error('Erro ao carregar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(selectedDate);
  }, [selectedDate]);

  const handleDownloadPDF = async () => {
    if (!reportData) return;
    
    try {
      await generatePDFReport(reportData, selectedDate);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
            >
              <ArrowLeft size={20} />
              Voltar ao PDV
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Printer size={18} />
                Imprimir
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            📊 Relatório de Vendas
          </h1>
          <p className="text-gray-600">Análise detalhada das vendas do período selecionado</p>
        </header>

        <ReportFilters
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isLoading={isLoading}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : reportData ? (
          <div id="report-content">
            <ReportSummary data={reportData} selectedDate={selectedDate} />
            <ReportTable data={reportData} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-600">Não há vendas registradas para o período selecionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
