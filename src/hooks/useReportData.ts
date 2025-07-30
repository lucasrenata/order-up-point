
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Comanda, Product } from '../types/types';
import { getBrazilianDateRange, formatBrazilianDate } from '../utils/dateUtils';

interface ReportData {
  comandas: Comanda[];
  produtos: Product[];
  totalVendas: number;
  totalItens: number;
  ticketMedio: number;
  formasPagamento: { forma: string; quantidade: number; icon: string; color: string }[];
}

export const useReportData = (selectedDate: string) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async (date: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 ===== INICIANDO BUSCA DE RELATÓRIO =====');
      console.log('📅 Data selecionada (Brasil):', date);
      console.log('📅 Data formatada:', formatBrazilianDate(date + 'T00:00:00Z'));
      
      const { start, end } = getBrazilianDateRange(date);
      console.log('🌍 Range UTC para consulta:', { start, end });
      
      // Buscar comandas pagas usando filtro de data UTC corrigido
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
        .not('data_pagamento', 'is', null)
        .gte('data_pagamento', start)
        .lte('data_pagamento', end)
        .order('data_pagamento', { ascending: false });

      if (comandasError) {
        console.error('❌ Erro ao buscar comandas:', comandasError);
        throw comandasError;
      }

      console.log('📊 Resultado da consulta:', {
        total_comandas: comandas?.length || 0,
        range_usado: { start, end }
      });
      
      // Log detalhado das comandas encontradas
      comandas?.forEach((comanda, index) => {
        const brazilianTime = new Date(comanda.data_pagamento).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        console.log(`📋 Comanda ${index + 1}:`, {
          id: comanda.identificador_cliente,
          total: comanda.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          created_at_utc: comanda.created_at,
          data_pagamento_utc: comanda.data_pagamento,
          data_referencia_br: brazilianTime,
          itens: comanda.comanda_itens?.length || 0
        });
      });

      // Buscar produtos
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('*');

      if (produtosError) {
        console.error('❌ Erro ao buscar produtos:', produtosError);
        throw produtosError;
      }

      // Calcular estatísticas com validação aprimorada
      const totalVendas = comandas?.reduce((sum, comanda) => {
        const total = parseFloat(comanda.total?.toString() || '0');
        if (isNaN(total)) {
          console.warn(`⚠️ Total inválido na comanda ${comanda.identificador_cliente}:`, comanda.total);
          return sum;
        }
        return sum + total;
      }, 0) || 0;

      const totalItens = comandas?.reduce((sum, comanda) => {
        const itensCount = comanda.comanda_itens?.reduce((itemSum, item) => itemSum + item.quantidade, 0) || 0;
        return sum + itensCount;
      }, 0) || 0;
      
      const ticketMedio = comandas?.length ? totalVendas / comandas.length : 0;

      console.log('📈 ===== ESTATÍSTICAS FINAIS =====');
      console.log('📅 Data:', formatBrazilianDate(date + 'T00:00:00Z'));
      console.log('💰 Total vendas:', totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      console.log('📦 Total itens:', totalItens);
      console.log('🎯 Ticket médio:', ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      console.log('📋 Comandas encontradas:', comandas?.length || 0);

      // Função para obter dados da forma de pagamento
      const getPaymentMethodDisplay = (forma_pagamento: string | null) => {
        switch (forma_pagamento) {
          case 'dinheiro':
            return { icon: '💵', text: 'Dinheiro', color: 'text-green-600' };
          case 'pix':
            return { icon: '📱', text: 'Pix', color: 'text-blue-600' };
          case 'debito':
            return { icon: '💳', text: 'Cartão Débito', color: 'text-purple-600' };
          case 'credito':
            return { icon: '🏦', text: 'Cartão Crédito', color: 'text-orange-600' };
          default:
            return { icon: '❓', text: 'Não informado', color: 'text-gray-600' };
        }
      };

      // Calcular formas de pagamento
      const formasPagamentoCount: { [key: string]: number } = {};
      comandas?.forEach(comanda => {
        const forma = comanda.forma_pagamento || 'não informado';
        formasPagamentoCount[forma] = (formasPagamentoCount[forma] || 0) + 1;
      });

      const formasPagamento = Object.entries(formasPagamentoCount)
        .map(([forma, quantidade]) => {
          const displayData = getPaymentMethodDisplay(forma === 'não informado' ? null : forma);
          return {
            forma: displayData.text,
            quantidade,
            icon: displayData.icon,
            color: displayData.color
          };
        })
        .sort((a, b) => b.quantidade - a.quantidade);

      console.log('💳 Formas de pagamento:', formasPagamento);
      console.log('✅ ===== RELATÓRIO CONCLUÍDO =====');

      setReportData({
        comandas: comandas || [],
        produtos: produtos || [],
        totalVendas,
        totalItens,
        ticketMedio,
        formasPagamento
      });
    } catch (error) {
      console.error('❌ Erro ao buscar dados do relatório:', error);
      setError('Erro ao carregar relatório');
      toast.error('Erro ao carregar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(selectedDate);
  }, [selectedDate]);

  return {
    reportData,
    isLoading,
    error,
    refetch: () => fetchReportData(selectedDate)
  };
};
