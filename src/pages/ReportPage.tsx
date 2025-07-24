import React, { useState } from 'react';
import { ArrowLeft, Download, Printer, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ReportSummary } from '../components/ReportSummary';
import { ReportTable } from '../components/ReportTable';
import { ReportFilters } from '../components/ReportFilters';
import { DataCleanupModal } from '../components/DataCleanupModal';
import { generatePDFReport } from '../utils/pdfGenerator';
import { useReportData } from '../hooks/useReportData';
import { getCurrentBrazilianDate } from '../utils/dateUtils';

export default function ReportPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getCurrentBrazilianDate());
  const { reportData, isLoading, error, refetch } = useReportData(selectedDate);

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
              <DataCleanupModal />
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
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                📈 <strong>{reportData.comandas.length}</strong> comandas encontradas para {new Date(selectedDate).toLocaleDateString('pt-BR')}
                {reportData.totalVendas > 0 && (
                  <span className="ml-4">
                    💰 Total: <strong>{reportData.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  </span>
                )}
              </p>
            </div>
            <ReportSummary data={reportData} selectedDate={selectedDate} />
            <ReportTable data={reportData} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-600">Não há vendas registradas para {new Date(selectedDate).toLocaleDateString('pt-BR')}.</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
