import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Comanda } from '@/types/types';

interface StockUpdate {
  produto: string;
  quantidade: number;
  estoqueAnterior: number;
  estoqueNovo: number;
}

interface StockReductionResult {
  stockUpdates: StockUpdate[];
  lowStockAlerts: string[];
  success: boolean;
  error?: string;
}

export const useStockManager = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processStockReduction = async (comanda: Comanda): Promise<StockReductionResult> => {
    if (isProcessing) {
      return { stockUpdates: [], lowStockAlerts: [], success: false, error: 'Operação já em andamento' };
    }

    setIsProcessing(true);
    
    try {
      console.log('🔄 Iniciando processamento de baixa no estoque...');
      
      // Filtrar apenas itens com produto_id
      const itemsWithProducts = comanda.comanda_itens.filter(item => item.produto_id);
      
      if (itemsWithProducts.length === 0) {
        console.log('✅ Nenhum item com produto para processar');
        return { stockUpdates: [], lowStockAlerts: [], success: true };
      }

      // Buscar todos os produtos em uma única consulta
      const productIds = itemsWithProducts.map(item => item.produto_id);
      const { data: produtos, error: fetchError } = await supabase
        .from('produtos')
        .select('*')
        .in('id', productIds);

      if (fetchError) {
        console.error('❌ Erro ao buscar produtos:', fetchError);
        throw new Error(`Erro ao buscar produtos: ${fetchError.message}`);
      }

      if (!produtos || produtos.length === 0) {
        throw new Error('Nenhum produto encontrado');
      }

      // Consolidar quantidades por produto (caso haja produtos duplicados)
      const produtoQuantidades = new Map<number, number>();
      for (const item of itemsWithProducts) {
        const quantidadeAtual = produtoQuantidades.get(item.produto_id!) || 0;
        produtoQuantidades.set(item.produto_id!, quantidadeAtual + item.quantidade);
      }

      // Calcular atualizações necessárias
      const stockUpdates: StockUpdate[] = [];
      const lowStockAlerts: string[] = [];
      const updatedProducts: number[] = [];

      // Validar estoque disponível antes de qualquer operação
      for (const [produtoId, quantidadeTotal] of produtoQuantidades) {
        const produto = produtos.find(p => p.id === produtoId);
        
        if (!produto) {
          console.warn(`⚠️ Produto ${produtoId} não encontrado`);
          continue;
        }

        if (produto.estoque_atual < quantidadeTotal) {
          throw new Error(`Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque_atual}, Necessário: ${quantidadeTotal}`);
        }
      }

      // Executar atualizações sequenciais com rollback em caso de erro
      for (const [produtoId, quantidadeTotal] of produtoQuantidades) {
        const produto = produtos.find(p => p.id === produtoId);
        
        if (!produto) continue;

        const novoEstoque = produto.estoque_atual - quantidadeTotal;

        console.log(`📦 Atualizando estoque: ${produto.nome} - ${quantidadeTotal} unidades (${produto.estoque_atual} → ${novoEstoque})`);

        // Usar UPDATE em vez de UPSERT para produtos existentes
        const { error: updateError } = await supabase
          .from('produtos')
          .update({ estoque_atual: novoEstoque })
          .eq('id', produtoId);

        if (updateError) {
          console.error(`❌ Erro ao atualizar produto ${produto.nome}:`, updateError);
          
          // Reverter produtos já atualizados
          if (updatedProducts.length > 0) {
            console.log('🔄 Revertendo atualizações...');
            for (const revertId of updatedProducts) {
              const produtoRevert = produtos.find(p => p.id === revertId);
              if (produtoRevert) {
                const quantidadeRevert = produtoQuantidades.get(revertId) || 0;
                await supabase
                  .from('produtos')
                  .update({ estoque_atual: produtoRevert.estoque_atual })
                  .eq('id', revertId);
                console.log(`↩️ Revertido: ${produtoRevert.nome}`);
              }
            }
          }
          
          throw new Error(`Erro ao atualizar estoque do produto ${produto.nome}: ${updateError.message}`);
        }

        // Registrar produto atualizado para possível rollback
        updatedProducts.push(produtoId);

        stockUpdates.push({
          produto: produto.nome,
          quantidade: quantidadeTotal,
          estoqueAnterior: produto.estoque_atual,
          estoqueNovo: novoEstoque
        });

        // Verificar estoque baixo
        if (novoEstoque <= (produto.estoque_minimo || 0)) {
          lowStockAlerts.push(produto.nome);
        }
      }

      console.log('✅ Baixa no estoque processada com sucesso');
      
      if (lowStockAlerts.length > 0) {
        console.log('⚠️ Produtos com estoque baixo:', lowStockAlerts.join(', '));
      }

      return {
        stockUpdates,
        lowStockAlerts,
        success: true
      };

    } catch (error) {
      console.error('❌ Erro no processamento de estoque:', error);
      return {
        stockUpdates: [],
        lowStockAlerts: [],
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processStockReduction,
    isProcessing
  };
};