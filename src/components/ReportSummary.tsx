import React from 'react';
import { DollarSign, Package, TrendingUp, Award, UtensilsCrossed, Box, Sun, Moon } from 'lucide-react';
import { formatBrazilianDateDirect } from '../utils/dateUtils';

interface ReportSummaryProps {
  data: {
    totalVendas: number;
    totalItens: number;
    ticketMedio: number;
    comandas: any[];
    formasPagamento: { forma: string; quantidade: number; icon: string; color: string }[];
    pratoPorQuilo: number;
    pratoPorQuiloAlmoco: number;
    pratoPorQuiloJantar: number;
    totalMarmitex: number;
    totalMarmitexAlmoco: number;
    totalMarmitexJantar: number;
    totalDescontos: number;
    totalBruto: number;
    totalLiquido: number;
    comandasComDesconto: number;
  };
  selectedDate: string;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({ data, selectedDate }) => {
  const displayDate = data.comandas.length > 0 
    ? formatBrazilianDateDirect(data.comandas[0].data_pagamento)
    : formatBrazilianDateDirect(selectedDate + 'T00:00:00Z');

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Faturamento Bruto</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.totalBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-gray-500 mt-1">antes dos descontos</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Descontos</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.totalDescontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-gray-500 mt-1">{data.comandasComDesconto} comandas</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏷️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Faturamento Líquido</p>
              <p className="text-2xl font-bold text-green-600">
                {data.totalLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-xs text-gray-500 mt-1">após descontos</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Vendas</p>
              <p className="text-2xl font-bold text-indigo-600">
                {data.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <DollarSign className="text-indigo-600" size={24} />
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

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Almoço (10h-16h30)</p>
              <p className="text-2xl font-bold text-amber-600">{data.pratoPorQuiloAlmoco}</p>
              <p className="text-xs text-gray-500 mt-1">pratos por quilo</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Sun className="text-amber-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jantar (17h-23h)</p>
              <p className="text-2xl font-bold text-indigo-600">{data.pratoPorQuiloJantar}</p>
              <p className="text-xs text-gray-500 mt-1">pratos por quilo</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Moon className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Marmitex Almoço</p>
              <p className="text-2xl font-bold text-amber-600">{data.totalMarmitexAlmoco}</p>
              <p className="text-xs text-gray-500 mt-1">10h às 16h30</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Box className="text-amber-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Marmitex Jantar</p>
              <p className="text-2xl font-bold text-indigo-600">{data.totalMarmitexJantar}</p>
              <p className="text-xs text-gray-500 mt-1">17h às 23h</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Box className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {data.formasPagamento.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="text-green-500" size={20} />
            Formas de Pagamento - {displayDate}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.formasPagamento.map((item, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="font-semibold text-sm text-gray-800">{item.forma}</p>
                <p className="text-sm text-gray-600">{item.quantidade} comandas</p>
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
