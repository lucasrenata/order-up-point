import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Comanda, Product } from '../types/types';
import { getBrazilianDateRange } from '../utils/dateUtils';

interface ReportData {
  comandas: Comanda[];
  produtos: Product[];
  totalVendas: number;
  totalItens: number;
  ticketMedio: number;
  produtosMaisVendidos: { produto: Product; quantidade: number }[];
}

export const useReportData = (selectedDate: string) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async (date: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Buscando dados para a data brasileira:', date);
      
      const { start, end } = getBrazilianDateRange(date);
      console.log(`🕐 Intervalo de busca UTC: ${start} até ${end}`);
      console.log(`🇧🇷 Data selecionada (Brasil): ${date}`);
      console.log(`🌍 Data atual UTC: ${new Date().toISOString().split('T')[0]}`);
      console.log(`🇧🇷 Horário atual Brasil: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
      
      // Buscar comandas pagas usando filtro de data brasileira
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

      console.log('✅ Comandas encontradas:', comandas?.length || 0);
      
      // Log detalhado das comandas com horário brasileiro
      comandas?.forEach((comanda, index) => {
        const brazilianTime = new Date(comanda.data_pagamento).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const utcTime = new Date(comanda.data_pagamento).toISOString();
        
        console.log(`📋 Comanda ${index + 1}:`, {
          id: comanda.id,
          identificador: comanda.identificador_cliente,
          total: comanda.total,
          data_pagamento_utc: utcTime,
          data_pagamento_br: brazilianTime,
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

      console.log('📊 Estatísticas calculadas para', date, '(horário brasileiro):');
      console.log('💰 Total de vendas:', totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      console.log('📦 Total de itens:', totalItens);
      console.log('🎯 Ticket médio:', ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      console.log('📋 Número de comandas:', comandas?.length || 0);

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

      console.log('🏆 Produtos mais vendidos:', produtosMaisVendidos);

      setReportData({
        comandas: comandas || [],
        produtos: produtos || [],
        totalVendas,
        totalItens,
        ticketMedio,
        produtosMaisVendidos
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
