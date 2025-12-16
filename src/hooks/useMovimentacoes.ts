import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Comanda } from '@/types/types';
import { toast } from 'sonner';

interface MovimentacoesData {
  comandas: Comanda[];
  totalComandas: number;
  valorTotal: number;
  diasComDados: number;
  dataInicio: string;
  dataFim: string;
}

interface DadosAntigos {
  existe: boolean;
  quantidade: number;
  valorTotal: number;
  dataLimite: string;
}

export const useMovimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacoesData | null>(null);
  const [dadosAntigos, setDadosAntigos] = useState<DadosAntigos>({ existe: false, quantidade: 0, valorTotal: 0, dataLimite: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calcular data limite (7 dias atrás)
  const calcularDataLimite = useCallback(() => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() - 7);
    hoje.setHours(0, 0, 0, 0);
    return hoje.toISOString();
  }, []);

  // Buscar movimentações dos últimos 7 dias
  const fetchMovimentacoes = useCallback(async () => {
    setIsLoading(true);
    try {
      const dataLimite = calcularDataLimite();
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);

      console.log('📅 Buscando movimentações desde:', dataLimite);

      const { data: comandas, error } = await (supabase
        .from('comandas' as any)
        .select(`
          *,
          comanda_itens (*)
        `)
        .eq('status', 'paga')
        .gte('data_pagamento', dataLimite)
        .lte('data_pagamento', hoje.toISOString())
        .order('data_pagamento', { ascending: false }) as any);

      if (error) throw error;

      // Processar dados
      const comandasProcessadas = (comandas || []).map((c: any) => ({
        ...c,
        comanda_itens: c.comanda_itens || []
      })) as Comanda[];

      const valorTotal = comandasProcessadas.reduce((acc, c) => acc + (c.total || 0), 0);
      
      // Calcular dias únicos com dados
      const diasUnicos = new Set(
        comandasProcessadas.map(c => c.data_pagamento?.split('T')[0])
      );

      setMovimentacoes({
        comandas: comandasProcessadas,
        totalComandas: comandasProcessadas.length,
        valorTotal,
        diasComDados: diasUnicos.size,
        dataInicio: dataLimite.split('T')[0],
        dataFim: hoje.toISOString().split('T')[0]
      });

      console.log('✅ Movimentações carregadas:', comandasProcessadas.length);
    } catch (error: any) {
      console.error('❌ Erro ao buscar movimentações:', error);
      toast.error('Erro ao carregar movimentações');
    } finally {
      setIsLoading(false);
    }
  }, [calcularDataLimite]);

  // Verificar se existem dados com mais de 7 dias
  const verificarDadosAntigos = useCallback(async () => {
    try {
      const dataLimite = calcularDataLimite();

      console.log('🔍 Verificando dados anteriores a:', dataLimite);

      const { data: comandasAntigas, error } = await (supabase
        .from('comandas' as any)
        .select('id, total')
        .eq('status', 'paga')
        .lt('data_pagamento', dataLimite) as any);

      if (error) throw error;

      const quantidade = comandasAntigas?.length || 0;
      const valorTotal = comandasAntigas?.reduce((acc: number, c: any) => acc + (c.total || 0), 0) || 0;

      setDadosAntigos({
        existe: quantidade > 0,
        quantidade,
        valorTotal,
        dataLimite: dataLimite.split('T')[0]
      });

      console.log('📊 Dados antigos encontrados:', quantidade);
    } catch (error: any) {
      console.error('❌ Erro ao verificar dados antigos:', error);
    }
  }, [calcularDataLimite]);

  // Deletar dados com mais de 7 dias
  const deletarDadosAntigos = useCallback(async () => {
    setIsDeleting(true);
    try {
      const dataLimite = calcularDataLimite();

      console.log('🗑️ Deletando dados anteriores a:', dataLimite);

      // 1. Buscar IDs das comandas antigas
      const { data: comandasAntigas, error: fetchError } = await (supabase
        .from('comandas' as any)
        .select('id')
        .eq('status', 'paga')
        .lt('data_pagamento', dataLimite) as any);

      if (fetchError) throw fetchError;

      const comandaIds = comandasAntigas?.map((c: any) => c.id) || [];

      if (comandaIds.length === 0) {
        toast.info('Nenhum dado antigo para deletar');
        setIsDeleting(false);
        return;
      }

      console.log('📋 Comandas a deletar:', comandaIds.length);

      // 2. Deletar itens das comandas antigas
      const { error: deleteItensError } = await (supabase
        .from('comanda_itens' as any)
        .delete()
        .in('comanda_id', comandaIds) as any);

      if (deleteItensError) throw deleteItensError;

      // 3. Deletar comandas antigas
      const { error: deleteComandasError } = await (supabase
        .from('comandas' as any)
        .delete()
        .in('id', comandaIds) as any);

      if (deleteComandasError) throw deleteComandasError;

      // 4. Deletar retiradas antigas (por data)
      const { error: deleteRetiradasError } = await (supabase
        .from('caixa_retiradas' as any)
        .delete()
        .lt('data_retirada', dataLimite) as any);

      if (deleteRetiradasError) console.warn('Erro ao deletar retiradas:', deleteRetiradasError);

      // 5. Deletar entradas antigas (por data)
      const { error: deleteEntradasError } = await (supabase
        .from('caixa_entradas' as any)
        .delete()
        .lt('data_entrada', dataLimite) as any);

      if (deleteEntradasError) console.warn('Erro ao deletar entradas:', deleteEntradasError);

      // 6. Deletar pagamentos de reserva antigos (por data)
      const { error: deleteReservasError } = await (supabase
        .from('caixa_pagamentos_reserva' as any)
        .delete()
        .lt('data_pagamento', dataLimite) as any);

      if (deleteReservasError) console.warn('Erro ao deletar reservas:', deleteReservasError);

      toast.success(`${comandaIds.length} comandas antigas deletadas com sucesso!`);

      // Atualizar dados
      await fetchMovimentacoes();
      await verificarDadosAntigos();

    } catch (error: any) {
      console.error('❌ Erro ao deletar dados antigos:', error);
      toast.error(`Erro ao deletar dados: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  }, [calcularDataLimite, fetchMovimentacoes, verificarDadosAntigos]);

  return {
    movimentacoes,
    dadosAntigos,
    isLoading,
    isDeleting,
    fetchMovimentacoes,
    verificarDadosAntigos,
    deletarDadosAntigos
  };
};
