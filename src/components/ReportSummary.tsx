
import React from 'react';
import { DollarSign, Package, TrendingUp, Award } from 'lucide-react';
import { formatBrazilianDate } from '../utils/dateUtils';

interface ReportSummaryProps {
  data: {
    totalVendas: number;
    totalItens: number;
    ticketMedio: number;
    comandas: any[];
    produtosMaisVendidos: { produto: any; quantidade: number }[];
  };
  selectedDate: string;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({ data, selectedDate }) => {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 truncate">Total de Vendas</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">
                {data.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 truncate">Comandas Pagas</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{data.comandas.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Package className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 truncate">Total de Itens</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{data.totalItens}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600 truncate">Ticket Médio</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 truncate">
                {data.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="text-orange-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {data.produtosMaisVendidos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={20} />
            <span className="truncate">Produtos Mais Vendidos - {formatBrazilianDate(selectedDate)}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {data.produtosMaisVendidos.map((item, index) => (
              <div key={item.produto.id} className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl sm:text-3xl mb-2">{item.produto.img}</div>
                <p className="font-semibold text-xs sm:text-sm text-gray-800 truncate">{item.produto.nome}</p>
                <p className="text-xs sm:text-sm text-gray-600">{item.quantidade} vendidos</p>
                <div className="text-xs text-gray-500 mt-1">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
