
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Comanda, Product } from '../types/types';
import { getBrazilianDateRangeSimple, formatBrazilianDateDirect, formatBrazilianDateTimeDirect } from '../utils/dateUtils';

interface ReportData {
  comandas: Comanda[];
  produtos: Product[];
  totalVendas: number;
  totalItens: number;
  ticketMedio: number;
  formasPagamento: { forma: string; quantidade: number; icon: string; color: string }[];
  pratoPorQuilo: number;
  pratoPorQuiloAlmoco: number;
  pratoPorQuiloJantar: number;
  totalMarmitex: number;
  totalMarmitexAlmoco: number;
  totalMarmitexJantar: number;
  refeicaoLivre: number;
  refeicaoLivreAlmoco: number;
  refeicaoLivreJantar: number;
  totalDescontos: number;
  totalBruto: number;
  totalLiquido: number;
  comandasComDesconto: number;
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
      console.log('📅 Data formatada:', formatBrazilianDateDirect(date + 'T00:00:00Z'));
      
      const { start, end } = getBrazilianDateRangeSimple(date);
      console.log('🌍 Range UTC simples para consulta:', { start, end });
      
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
        const brazilianTime = formatBrazilianDateTimeDirect(comanda.data_pagamento);
        
        console.log(`📋 Comanda ${index + 1}:`, {
          id: comanda.identificador_cliente,
          total: comanda.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          data_pagamento_raw: comanda.data_pagamento,
          data_pagamento_formatada: brazilianTime,
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

      // Função auxiliar para extrair hora brasileira de uma data UTC
      const getBrazilianHour = (dateString: string): number => {
        const date = new Date(dateString);
        const brazilianTime = date.toLocaleString('pt-BR', { 
          timeZone: 'America/Sao_Paulo', 
          hour: '2-digit', 
          hour12: false 
        });
        return parseInt(brazilianTime, 10);
      };

      // Função auxiliar para obter hora e minuto brasileiros
      const getBrazilianTime = (dateString: string): { hora: number; minuto: number } => {
        const date = new Date(dateString);
        const horaStr = date.toLocaleString('pt-BR', { 
          timeZone: 'America/Sao_Paulo', 
          hour: '2-digit', 
          hour12: false 
        });
        const minutoStr = date.toLocaleString('pt-BR', { 
          timeZone: 'America/Sao_Paulo', 
          minute: '2-digit'
        });
        return { hora: parseInt(horaStr, 10), minuto: parseInt(minutoStr, 10) };
      };

      // Função para verificar se está no período do almoço (10:00 - 16:30)
      const isAlmoco = (dateString: string): boolean => {
        const { hora, minuto } = getBrazilianTime(dateString);
        const totalMinutos = hora * 60 + minuto;
        // 10:00 = 600 minutos, 16:30 = 990 minutos
        return totalMinutos >= 600 && totalMinutos <= 990;
      };

      // Função para verificar se está no período do jantar (17:00 - 23:59)
      const isJantar = (dateString: string): boolean => {
        const { hora } = getBrazilianTime(dateString);
        return hora >= 17 && hora <= 23;
      };

      // Contar QUANTIDADE total de "Prato por Quilo" vendidos (soma das quantidades)
      let pratoPorQuilo = 0;
      let pratoPorQuiloAlmoco = 0; // 10:00 - 16:30
      let pratoPorQuiloJantar = 0; // 17:00 - 23:59

      // Contar QUANTIDADE total de "Marmitex" vendidos (soma das quantidades)
      let totalMarmitex = 0;
      let totalMarmitexAlmoco = 0;
      let totalMarmitexJantar = 0;

      let refeicaoLivre = 0;
      let refeicaoLivreAlmoco = 0;
      let refeicaoLivreJantar = 0;

      comandas?.forEach(comanda => {
        // Prato por Quilo
        const pratosQuilo = comanda.comanda_itens?.filter(item => 
          item.tipo_item === 'prato_por_quilo' || (item.tipo_item === undefined && item.produto_id === null && item.descricao === 'Prato por Quilo')
        ) || [];
        
        const quantidadePratoQuilo = pratosQuilo.reduce((sum, item) => sum + (item.quantidade || 1), 0);
        pratoPorQuilo += quantidadePratoQuilo;

        // Marmitex
        const marmitexItens = comanda.comanda_itens?.filter(item => 
          item.tipo_item === 'marmitex' || (item.tipo_item === undefined && item.produto_id === null && item.descricao === 'Marmitex')
        ) || [];
        
        const quantidadeMarmitex = marmitexItens.reduce((sum, item) => sum + (item.quantidade || 1), 0);
        totalMarmitex += quantidadeMarmitex;

        // Refeição Livre
        const refeicaoLivreItens = comanda.comanda_itens?.filter(item => 
          item.tipo_item === 'refeicao_livre' || (item.tipo_item === undefined && item.produto_id === null && item.descricao === 'Refeição Livre')
        ) || [];
        
        const quantidadeRefeicaoLivre = refeicaoLivreItens.reduce((sum, item) => sum + (item.quantidade || 1), 0);
        refeicaoLivre += quantidadeRefeicaoLivre;

        // Verificar horário do pagamento para separar almoço/jantar
        if (comanda.data_pagamento) {
          if (isAlmoco(comanda.data_pagamento)) {
            pratoPorQuiloAlmoco += quantidadePratoQuilo;
            totalMarmitexAlmoco += quantidadeMarmitex;
            refeicaoLivreAlmoco += quantidadeRefeicaoLivre;
          } else if (isJantar(comanda.data_pagamento)) {
            pratoPorQuiloJantar += quantidadePratoQuilo;
            totalMarmitexJantar += quantidadeMarmitex;
            refeicaoLivreJantar += quantidadeRefeicaoLivre;
          }
        }
      });

      console.log('📈 ===== ESTATÍSTICAS FINAIS =====');
      console.log('📅 Data:', formatBrazilianDateDirect(date + 'T00:00:00Z'));
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
          case 'voucher':
            return { icon: '🎟️', text: 'Voucher', color: 'text-teal-600' };
          default:
            return { icon: '❓', text: 'Não informado', color: 'text-gray-600' };
        }
      };

      // Calcular formas de pagamento
      const formasPagamentoCount: { [key: string]: number } = {};
      comandas?.forEach(comanda => {
        // Para pagamentos divididos, contar cada forma individualmente
        if (comanda.forma_pagamento === 'multiplo' && comanda.pagamentos_divididos && comanda.pagamentos_divididos.length > 0) {
          comanda.pagamentos_divididos.forEach((pagamento: any) => {
            const forma = pagamento.forma_pagamento || 'não informado';
            formasPagamentoCount[forma] = (formasPagamentoCount[forma] || 0) + 1;
          });
        } else {
          // Para pagamentos únicos
          const forma = comanda.forma_pagamento || 'não informado';
          formasPagamentoCount[forma] = (formasPagamentoCount[forma] || 0) + 1;
        }
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

      // Calcular estatísticas de desconto
      const totalDescontos = comandas?.reduce((sum, comanda) => {
        return sum + (comanda.desconto || 0);
      }, 0) || 0;

      const totalBruto = comandas?.reduce((sum, comanda) => {
        return sum + (comanda.total || 0);
      }, 0) || 0;

      const totalLiquido = totalBruto - totalDescontos;

      const comandasComDesconto = comandas?.filter(c => c.desconto && c.desconto > 0).length || 0;

      console.log('💳 Formas de pagamento:', formasPagamento);
      console.log('🏷️ Total de descontos:', totalDescontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      console.log('✅ ===== RELATÓRIO CONCLUÍDO =====');

      setReportData({
        comandas: comandas || [],
        produtos: produtos || [],
        totalVendas,
        totalItens,
        ticketMedio,
        formasPagamento,
        pratoPorQuilo,
        pratoPorQuiloAlmoco,
        pratoPorQuiloJantar,
        totalMarmitex,
        totalMarmitexAlmoco,
        totalMarmitexJantar,
        refeicaoLivre,
        refeicaoLivreAlmoco,
        refeicaoLivreJantar,
        totalDescontos,
        totalBruto,
        totalLiquido,
        comandasComDesconto
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
