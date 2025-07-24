
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Vendas</p>
              <p className="text-2xl font-bold text-green-600">
                {data.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comandas Pagas</p>
              <p className="text-2xl font-bold text-blue-600">{data.comandas.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Itens</p>
              <p className="text-2xl font-bold text-purple-600">{data.totalItens}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Award className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {data.produtosMaisVendidos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={20} />
            Produtos Mais Vendidos - {formatBrazilianDate(selectedDate)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {data.produtosMaisVendidos.map((item, index) => (
              <div key={item.produto.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">{item.produto.img}</div>
                <p className="font-semibold text-sm text-gray-800">{item.produto.nome}</p>
                <p className="text-sm text-gray-600">{item.quantidade} vendidos</p>
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
