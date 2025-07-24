import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  convertUTCToBrazilianDate, 
  getBrazilianDateRange, 
  getCurrentBrazilianDate,
  formatBrazilianDate 
} from '../utils/dateUtils';

interface DateSummary {
  date: string;
  count: number;
  totalValue: number;
  comandas: any[];
}

interface AllPaidSummary {
  count: number;
  totalValue: number;
  comandas: any[];
}

type CleanupMode = 'by-date' | 'all-paid';

export const useDataCleanup = () => {
  const [dateSummaries, setDateSummaries] = useState<DateSummary[]>([]);
  const [allPaidSummary, setAllPaidSummary] = useState<AllPaidSummary>({ count: 0, totalValue: 0, comandas: [] });
  const [cleanupMode, setCleanupMode] = useState<CleanupMode>('by-date');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAllPaidComandas = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔍 ===== BUSCANDO TODAS AS COMANDAS PAGAS =====');
      
      const { data: comandas, error } = await supabase
        .from('comandas')
        .select('*')
        .eq('status', 'paga')
        .not('data_pagamento', 'is', null)
        .order('data_pagamento', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar comandas pagas:', error);
        throw error;
      }

      console.log('📊 Total de comandas pagas encontradas:', comandas?.length || 0);
      
      // Log detalhado das comandas encontradas
      if (comandas && comandas.length > 0) {
        console.log('🔍 Detalhes das comandas pagas:');
        comandas.slice(0, 3).forEach((comanda, index) => {
          console.log(`  ${index + 1}. ${comanda.identificador_cliente} - ${comanda.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - ${formatBrazilianDate(comanda.data_pagamento)}`);
        });
        if (comandas.length > 3) {
          console.log(`  ... e mais ${comandas.length - 3} comandas`);
        }
      }

      const totalValue = comandas?.reduce((sum, comanda) => sum + (comanda.total || 0), 0) || 0;

      const summary: AllPaidSummary = {
        count: comandas?.length || 0,
        totalValue,
        comandas: comandas || []
      };

      console.log('💰 Valor total das comandas pagas:', totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      console.log('📋 Resumo final allPaidSummary:', summary);
      console.log('✅ ===== BUSCA DE COMANDAS PAGAS CONCLUÍDA =====');

      setAllPaidSummary(summary);
    } catch (error) {
      console.error('❌ Erro ao buscar comandas pagas:', error);
      toast.error('Erro ao carregar comandas pagas');
      setAllPaidSummary({ count: 0, totalValue: 0, comandas: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDateSummaries = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔍 ===== INICIANDO BUSCA DE DATAS PARA LIMPEZA =====');
      
      const { data: comandas, error } = await supabase
        .from('comandas')
        .select('*')
        .eq('status', 'paga')
        .not('data_pagamento', 'is', null)
        .order('data_pagamento', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar comandas:', error);
        throw error;
      }

      console.log('📊 Comandas encontradas para análise:', comandas?.length || 0);

      const currentBrazilianDate = getCurrentBrazilianDate();
      console.log('🇧🇷 Data atual brasileira:', currentBrazilianDate);

      const groupedByDate: { [key: string]: any[] } = {};
      let processedCount = 0;

      // MUDANÇA: Não excluir mais comandas do dia atual
      comandas?.forEach(comanda => {
        processedCount++;
        
        const brazilianDate = convertUTCToBrazilianDate(comanda.data_pagamento);
        
        if (processedCount <= 5) {
          console.log(`📅 Comanda ${comanda.identificador_cliente}:`, {
            utc: comanda.data_pagamento,
            brazilian: brazilianDate,
            brazilian_formatted: formatBrazilianDate(comanda.data_pagamento),
            isToday: brazilianDate === currentBrazilianDate
          });
        }
        
        // Incluir TODAS as comandas, incluindo as de hoje
        if (!groupedByDate[brazilianDate]) {
          groupedByDate[brazilianDate] = [];
        }
        groupedByDate[brazilianDate].push(comanda);
      });

      console.log('📊 Resumo do agrupamento:');
      console.log(`  Comandas processadas: ${processedCount}`);
      console.log(`  Datas encontradas: ${Object.keys(groupedByDate).length}`);
      console.log(`  Datas: ${Object.keys(groupedByDate).join(', ')}`);

      const summaries: DateSummary[] = Object.entries(groupedByDate)
        .map(([date, comandas]) => ({
          date,
          count: comandas.length,
          totalValue: comandas.reduce((sum, comanda) => sum + (comanda.total || 0), 0),
          comandas
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('📋 Resumo final das datas:');
      summaries.forEach(summary => {
        console.log(`  ${summary.date}: ${summary.count} comandas, ${summary.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
      });

      console.log('✅ ===== BUSCA DE DATAS CONCLUÍDA =====');
      setDateSummaries(summaries);
    } catch (error) {
      console.error('❌ Erro ao buscar resumo de datas:', error);
      toast.error('Erro ao carregar dados para limpeza');
      setDateSummaries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllPaidComandas = async () => {
    setIsDeleting(true);
    
    try {
      console.log('🗑️ ===== INICIANDO DELEÇÃO DE TODAS AS COMANDAS PAGAS =====');
      
      const { data: comandas, error: selectError } = await supabase
        .from('comandas')
        .select('id, identificador_cliente, data_pagamento, total')
        .eq('status', 'paga')
        .not('data_pagamento', 'is', null);

      if (selectError) {
        console.error('❌ Erro ao buscar comandas para deletar:', selectError);
        throw selectError;
      }

      console.log('📋 Comandas encontradas para deleção:', comandas?.length || 0);

      if (!comandas || comandas.length === 0) {
        console.log('ℹ️ Nenhuma comanda paga encontrada');
        toast.info('Nenhuma comanda paga encontrada');
        return;
      }

      const comandaIds = comandas.map(comanda => comanda.id);
      const totalValue = comandas.reduce((sum, comanda) => sum + (comanda.total || 0), 0);

      console.log(`💰 Valor total a ser deletado: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);

      // Deletar itens das comandas primeiro
      console.log('🗑️ Deletando itens das comandas...');
      const { error: deleteItensError } = await supabase
        .from('comanda_itens')
        .delete()
        .in('comanda_id', comandaIds);

      if (deleteItensError) {
        console.error('❌ Erro ao deletar itens das comandas:', deleteItensError);
        throw deleteItensError;
      }

      // Deletar comandas
      console.log('🗑️ Deletando comandas...');
      const { error: deleteComandasError } = await supabase
        .from('comandas')
        .delete()
        .in('id', comandaIds);

      if (deleteComandasError) {
        console.error('❌ Erro ao deletar comandas:', deleteComandasError);
        throw deleteComandasError;
      }

      console.log('✅ ===== DELEÇÃO DE TODAS AS COMANDAS CONCLUÍDA =====');
      console.log(`🗑️ ${comandaIds.length} comandas deletadas com sucesso`);
      toast.success(`${comandaIds.length} comandas deletadas com sucesso`);
      
      // Atualizar listas
      await fetchAllPaidComandas();
      await fetchDateSummaries();
    } catch (error) {
      console.error('❌ Erro ao deletar todas as comandas:', error);
      toast.error('Erro ao deletar comandas');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteComandasByDate = async (date: string) => {
    setIsDeleting(true);
    
    try {
      console.log('🗑️ ===== INICIANDO DELEÇÃO POR DATA =====');
      console.log('📅 Data brasileira selecionada:', date);
      console.log('📅 Data formatada:', formatBrazilianDate(date + 'T00:00:00Z'));
      
      const { start, end } = getBrazilianDateRange(date);
      console.log('🌍 Range UTC calculado:', { start, end });
      
      const { data: comandas, error: selectError } = await supabase
        .from('comandas')
        .select('id, identificador_cliente, data_pagamento, total')
        .eq('status', 'paga')
        .gte('data_pagamento', start)
        .lte('data_pagamento', end);

      if (selectError) {
        console.error('❌ Erro ao buscar comandas para deletar:', selectError);
        throw selectError;
      }

      console.log('📋 Comandas encontradas no range UTC:', comandas?.length || 0);

      if (!comandas || comandas.length === 0) {
        console.log('ℹ️ Nenhuma comanda encontrada para a data selecionada');
        toast.info('Nenhuma comanda encontrada para a data selecionada');
        return;
      }

      console.log('🔍 Validando comandas encontradas:');
      let validatedCount = 0;
      const comandaIds: string[] = [];

      comandas.forEach(comanda => {
        const brazilianDate = convertUTCToBrazilianDate(comanda.data_pagamento);
        const brazilianTime = new Date(comanda.data_pagamento).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });
        
        console.log(`  ${comanda.identificador_cliente}: UTC ${comanda.data_pagamento} → BR ${brazilianDate} (${brazilianTime})`);
        
        if (brazilianDate === date) {
          validatedCount++;
          comandaIds.push(comanda.id);
        } else {
          console.warn(`⚠️ Comanda ${comanda.identificador_cliente} não pertence ao dia ${date} (pertence ao dia ${brazilianDate})`);
        }
      });

      console.log(`✅ Comandas validadas para deleção: ${validatedCount} de ${comandas.length}`);

      if (comandaIds.length === 0) {
        console.log('❌ Nenhuma comanda válida encontrada após validação');
        toast.error('Nenhuma comanda válida encontrada para a data selecionada');
        return;
      }

      // Deletar itens das comandas primeiro
      console.log('🗑️ Deletando itens das comandas...');
      const { error: deleteItensError } = await supabase
        .from('comanda_itens')
        .delete()
        .in('comanda_id', comandaIds);

      if (deleteItensError) {
        console.error('❌ Erro ao deletar itens das comandas:', deleteItensError);
        throw deleteItensError;
      }

      // Deletar comandas
      console.log('🗑️ Deletando comandas...');
      const { error: deleteComandasError } = await supabase
        .from('comandas')
        .delete()
        .in('id', comandaIds);

      if (deleteComandasError) {
        console.error('❌ Erro ao deletar comandas:', deleteComandasError);
        throw deleteComandasError;
      }

      console.log('✅ ===== DELEÇÃO CONCLUÍDA =====');
      console.log(`🗑️ ${comandaIds.length} comandas deletadas com sucesso`);
      toast.success(`${comandaIds.length} comandas deletadas com sucesso`);
      
      // Atualizar listas
      await fetchDateSummaries();
      await fetchAllPaidComandas();
    } catch (error) {
      console.error('❌ Erro ao deletar comandas:', error);
      toast.error('Erro ao deletar comandas');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect executado, cleanupMode:', cleanupMode);
    if (cleanupMode === 'by-date') {
      fetchDateSummaries();
    } else {
      fetchAllPaidComandas();
    }
  }, [cleanupMode]);

  // Log do estado atual para debug
  useEffect(() => {
    console.log('📊 Estado atual do hook:', {
      cleanupMode,
      isLoading,
      isDeleting,
      dateSummariesCount: dateSummaries.length,
      allPaidSummary: {
        count: allPaidSummary.count,
        totalValue: allPaidSummary.totalValue,
        comandasLength: allPaidSummary.comandas.length
      }
    });
  }, [cleanupMode, isLoading, isDeleting, dateSummaries, allPaidSummary]);

  return {
    dateSummaries,
    allPaidSummary,
    cleanupMode,
    isLoading,
    isDeleting,
    setCleanupMode,
    fetchDateSummaries,
    fetchAllPaidComandas,
    deleteComandasByDate,
    deleteAllPaidComandas
  };
};
