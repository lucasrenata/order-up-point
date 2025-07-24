
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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
      console.log('🔍 Buscando datas com comandas pagas...');
      
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

      console.log('✅ Comandas encontradas:', comandas?.length || 0);

      // Agrupar comandas por data
      const groupedByDate: { [key: string]: any[] } = {};
      const today = new Date().toISOString().split('T')[0];

      comandas?.forEach(comanda => {
        const date = new Date(comanda.data_pagamento).toISOString().split('T')[0];
        
        // Não incluir comandas do dia atual
        if (date !== today) {
          if (!groupedByDate[date]) {
            groupedByDate[date] = [];
          }
          groupedByDate[date].push(comanda);
        }
      });

      // Converter para array de DateSummary
      const summaries: DateSummary[] = Object.entries(groupedByDate)
        .map(([date, comandas]) => ({
          date,
          count: comandas.length,
          totalValue: comandas.reduce((sum, comanda) => sum + (comanda.total || 0), 0),
          comandas
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('📊 Resumo por data:', summaries.length);
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
      console.log(`🗑️ Deletando comandas da data: ${date}`);
      
      // Buscar comandas da data específica
      const { data: comandas, error: selectError } = await supabase
        .from('comandas')
        .select('id')
        .eq('status', 'paga')
        .gte('data_pagamento', `${date}T00:00:00`)
        .lte('data_pagamento', `${date}T23:59:59`);

      if (selectError) {
        console.error('❌ Erro ao buscar comandas para deletar:', selectError);
        throw selectError;
      }

      if (!comandas || comandas.length === 0) {
        toast.info('Nenhuma comanda encontrada para a data selecionada');
        return;
      }

      const comandaIds = comandas.map(c => c.id);
      console.log(`📋 Deletando ${comandaIds.length} comandas...`);

      // Deletar itens das comandas primeiro (foreign key constraint)
      const { error: deleteItensError } = await supabase
        .from('comanda_itens')
        .delete()
        .in('comanda_id', comandaIds);

      if (deleteItensError) {
        console.error('❌ Erro ao deletar itens das comandas:', deleteItensError);
        throw deleteItensError;
      }

      // Deletar comandas
      const { error: deleteComandasError } = await supabase
        .from('comandas')
        .delete()
        .in('id', comandaIds);

      if (deleteComandasError) {
        console.error('❌ Erro ao deletar comandas:', deleteComandasError);
        throw deleteComandasError;
      }

      console.log('✅ Comandas deletadas com sucesso');
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
