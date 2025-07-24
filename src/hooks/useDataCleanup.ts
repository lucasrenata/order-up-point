
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

export const useDataCleanup = () => {
  const [dateSummaries, setDateSummaries] = useState<DateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

      // Obter data atual brasileira
      const currentBrazilianDate = getCurrentBrazilianDate();
      console.log('🇧🇷 Data atual brasileira (será excluída):', currentBrazilianDate);

      // Agrupar comandas por data brasileira
      const groupedByDate: { [key: string]: any[] } = {};
      let excludedTodayCount = 0;
      let processedCount = 0;

      comandas?.forEach(comanda => {
        processedCount++;
        
        // Converter UTC para horário brasileiro
        const brazilianDate = convertUTCToBrazilianDate(comanda.data_pagamento);
        
        if (processedCount <= 5) { // Log apenas as primeiras 5 para não poluir
          console.log(`📅 Comanda ${comanda.identificador_cliente}:`, {
            utc: comanda.data_pagamento,
            brazilian: brazilianDate,
            brazilian_formatted: formatBrazilianDate(comanda.data_pagamento),
            isToday: brazilianDate === currentBrazilianDate
          });
        }
        
        // Excluir comandas do dia atual
        if (brazilianDate === currentBrazilianDate) {
          excludedTodayCount++;
        } else {
          if (!groupedByDate[brazilianDate]) {
            groupedByDate[brazilianDate] = [];
          }
          groupedByDate[brazilianDate].push(comanda);
        }
      });

      console.log('📊 Resumo do agrupamento:');
      console.log(`  Comandas processadas: ${processedCount}`);
      console.log(`  Comandas excluídas (hoje): ${excludedTodayCount}`);
      console.log(`  Datas antigas encontradas: ${Object.keys(groupedByDate).length}`);

      // Converter para array de DateSummary
      const summaries: DateSummary[] = Object.entries(groupedByDate)
        .map(([date, comandas]) => ({
          date,
          count: comandas.length,
          totalValue: comandas.reduce((sum, comanda) => sum + (comanda.total || 0), 0),
          comandas
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('📋 Datas antigas por ordem (mais recente primeiro):');
      summaries.forEach((summary, index) => {
        const formattedDate = formatBrazilianDate(summary.date + 'T00:00:00Z');
        console.log(`  ${index + 1}. ${formattedDate}: ${summary.count} comandas, ${summary.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
      });

      console.log('✅ ===== BUSCA DE DATAS CONCLUÍDA =====');
      setDateSummaries(summaries);
    } catch (error) {
      console.error('❌ Erro ao buscar resumo de datas:', error);
      toast.error('Erro ao carregar dados para limpeza');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComandasByDate = async (date: string) => {
    setIsDeleting(true);
    
    try {
      console.log('🗑️ ===== INICIANDO DELEÇÃO =====');
      console.log('📅 Data brasileira selecionada:', date);
      console.log('📅 Data formatada:', formatBrazilianDate(date + 'T00:00:00Z'));
      
      // Obter range UTC para a data brasileira
      const { start, end } = getBrazilianDateRange(date);
      console.log('🌍 Range UTC calculado:', { start, end });
      
      // Buscar comandas da data específica usando o range UTC
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

      // Validar se as comandas encontradas pertencem realmente ao dia brasileiro selecionado
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

      // Deletar itens das comandas primeiro (foreign key constraint)
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
      
      // Atualizar lista
      await fetchDateSummaries();
    } catch (error) {
      console.error('❌ Erro ao deletar comandas:', error);
      toast.error('Erro ao deletar comandas');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchDateSummaries();
  }, []);

  return {
    dateSummaries,
    isLoading,
    isDeleting,
    fetchDateSummaries,
    deleteComandasByDate
  };
};
