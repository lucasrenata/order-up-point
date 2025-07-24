
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
import { getCurrentBrazilianDate, formatBrazilianDate } from '../utils/dateUtils';

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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-4 sm:mb-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold self-start"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Voltar ao PDV</span>
              <span className="sm:hidden">Voltar</span>
            </button>
            
            <div className="flex flex-wrap gap-2">
              <DataCleanupModal />
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2 justify-center sm:justify-start">
              📊 Relatório de Vendas
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Análise detalhada das vendas do período selecionado</p>
          </div>
        </header>

        <ReportFilters
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isLoading={isLoading}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : reportData ? (
          <div id="report-content">
            <ReportSummary data={reportData} selectedDate={selectedDate} />
            <ReportTable data={reportData} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-600 text-sm sm:text-base">Não há vendas registradas para {formatBrazilianDate(selectedDate + 'T00:00:00Z')}.</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
