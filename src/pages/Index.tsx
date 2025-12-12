import React, { useState, useEffect, useCallback } from 'react';
import { Barcode, FileText, Package, Receipt, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationModal } from '../components/NotificationModal';
import { PaymentModal } from '../components/PaymentModal';
import { OrderSummary } from '../components/OrderSummary';
import { InputPanel } from '../components/InputPanel';
import { CaixaModal } from '../components/CaixaModal';
import { supabase } from '../lib/supabase';
import { Comanda, ComandaItem, Product, PaymentSplit } from '../types/types';
import { useStockManager } from '../hooks/useStockManager';
import { toast } from 'sonner';
import { getCurrentBrazilianDateTime } from '../utils/dateUtils';

export default function Index() {
  const navigate = useNavigate();
  const { processStockReduction, isProcessing } = useStockManager();
  const [activeComanda, setActiveComanda] = useState<Comanda | null>(null);
  const [selectedComandas, setSelectedComandas] = useState<Comanda[]>([]);
  const [isMultiComandaMode, setIsMultiComandaMode] = useState(false);
  const [comandaCodeInput, setComandaCodeInput] = useState('');
  const [notification, setNotification] = useState({ message: '', type: 'info' as 'info' | 'error' | 'success' });
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCaixaModal, setShowCaixaModal] = useState(false);

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    toast[type](message);
  };

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('produtos').select('*');
    if (error) {
      console.error('Erro ao carregar produtos:', error);
      showNotification('Erro ao carregar produtos.', 'error');
    } else {
      setProdutos(data || []);
      console.log('Produtos carregados:', data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const reloadActiveComanda = async (comandaId: number) => {
    const { data, error } = await supabase
      .from('comandas')
      .select(`
        *,
        comanda_itens (*)
      `)
      .eq('id', comandaId)
      .single();
    
    if (error) {
      console.error('Erro ao recarregar comanda:', error);
      showNotification('Erro ao recarregar a comanda.', 'error');
      return;
    }
    
    console.log('🔍 Reload - Resposta completa:', data);
    console.log('📦 Reload - Itens da relação:', data?.comanda_itens);
    
    let itens = data?.comanda_itens || [];
    
    // Fallback: se itens vieram vazios, buscar separadamente
    if (itens.length === 0) {
      console.log('⚠️ Itens vazios na relação, buscando separadamente...');
      const { data: itensSeparados, error: itensError } = await supabase
        .from('comanda_itens')
        .select('*')
        .eq('comanda_id', comandaId);
      
      console.log('📦 Itens buscados separadamente:', itensSeparados, 'Erro:', itensError);
      
      if (!itensError && itensSeparados) {
        itens = itensSeparados;
      }
    }
    
    const enrichedComanda = {
      ...data,
      comanda_itens: itens
    };
    
    setActiveComanda(enrichedComanda);
    console.log('✅ Comanda recarregada:', enrichedComanda);
  };

  const handleAddItem = async (itemData: Omit<ComandaItem, 'id' | 'created_at'>) => {
    if (!activeComanda) return;
    
    console.log('Inserindo item:', itemData);
    
    const { data, error } = await supabase
      .from('comanda_itens')
      .insert({
        comanda_id: itemData.comanda_id,
        produto_id: itemData.produto_id,
        quantidade: itemData.quantidade,
        preco_unitario: itemData.preco_unitario,
        descricao: itemData.descricao,
        tipo_item: itemData.tipo_item
      })
      .select();
    
    if (error) {
      console.error('Erro ao adicionar item:', error);
      showNotification('Erro ao adicionar item.', 'error');
    } else {
      console.log('Item adicionado com sucesso:', data);
      await reloadActiveComanda(activeComanda.id);
    }
  };

  const handleAddProduto = async (produto: Product) => {
    if (!activeComanda) return;
    
    await handleAddItem({
      comanda_id: activeComanda.id,
      produto_id: produto.id,
      quantidade: 1,
      preco_unitario: produto.preco,
      descricao: produto.nome,
      tipo_item: 'produto'
    });
    showNotification(`${produto.nome} adicionado!`, 'success');
  };

  const handleAddPratoPorPeso = async (valor: number) => {
    if (!activeComanda) return;
    
    await handleAddItem({
      comanda_id: activeComanda.id,
      produto_id: null,
      quantidade: 1,
      preco_unitario: valor,
      descricao: 'Prato por Quilo',
      tipo_item: 'prato_por_quilo'
    });
    showNotification(`Prato de ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} adicionado!`, 'success');
  };

  const handleAddMarmitex = async (valor: number) => {
    if (!activeComanda) return;
    
    await handleAddItem({
      comanda_id: activeComanda.id,
      produto_id: null,
      quantidade: 1,
      preco_unitario: valor,
      descricao: 'Marmitex',
      tipo_item: 'marmitex'
    });
    showNotification(`Marmitex de ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} adicionado!`, 'success');
  };

  const handleRemoveItem = async (comandaItemId: number) => {
    if (!activeComanda) return;
    
    const { error } = await supabase.from('comanda_itens').delete().eq('id', comandaItemId);
    if (error) {
      console.error('Erro ao remover item:', error);
      showNotification('Erro ao remover item.', 'error');
    } else {
      showNotification('Item removido.', 'info');
      await reloadActiveComanda(activeComanda.id);
    }
  };

  const handleClearComanda = async () => {
    if (!activeComanda) return;
    
    const { error } = await supabase.from('comanda_itens').delete().eq('comanda_id', activeComanda.id);
    if (error) {
      console.error('Erro ao limpar itens:', error);
      showNotification('Erro ao limpar itens.', 'error');
    } else {
      showNotification("Itens da comanda removidos.", 'info');
      await reloadActiveComanda(activeComanda.id);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (!activeComanda) return;
    
    // Validações
    if (newQuantity < 1) {
      showNotification('Quantidade deve ser no mínimo 1', 'error');
      return;
    }
    
    if (newQuantity > 999) {
      showNotification('Quantidade máxima: 999', 'error');
      return;
    }
    
    // Buscar item atual
    const item = activeComanda.comanda_itens.find(i => i.id === itemId);
    if (!item) return;
    
    // Atualizar no banco
    const { error } = await supabase
      .from('comanda_itens')
      .update({ quantidade: newQuantity })
      .eq('id', itemId);
    
    if (error) {
      console.error('Erro ao atualizar quantidade:', error);
      showNotification('Erro ao atualizar quantidade.', 'error');
    } else {
      const produto = item.produto_id ? produtos.find(p => p.id === item.produto_id) : null;
      const nome = item.descricao || produto?.nome || 'Item';
      const novoTotal = newQuantity * parseFloat(item.preco_unitario.toString());
      
      showNotification(
        `Quantidade atualizada: ${newQuantity}x ${nome} = ${novoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        'success'
      );
      
      // Recarregar comanda para atualizar totais
      await reloadActiveComanda(activeComanda.id);
    }
  };

  const addComandaToSelection = async (comandaId: string) => {
    const { data: comanda, error } = await supabase
      .from('comandas')
      .select(`
        *,
        comanda_itens (
          id, created_at, comanda_id, produto_id,
          quantidade, preco_unitario, descricao
        )
      `)
      .eq('identificador_cliente', comandaId)
      .eq('status', 'aberta')
      .maybeSingle();

    if (error) {
      showNotification('Erro ao buscar comanda.', 'error');
      return;
    }

    if (!comanda) {
      showNotification(`Comanda #${comandaId} não encontrada ou já está paga.`, 'error');
      return;
    }

    const alreadySelected = selectedComandas.some(c => c.id === comanda.id);
    if (alreadySelected) {
      showNotification(`Comanda #${comandaId} já foi adicionada.`, 'info');
      return;
    }

    const enrichedComanda = {
      ...comanda,
      comanda_itens: comanda.comanda_itens || []
    };

    setSelectedComandas(prev => [...prev, enrichedComanda]);
    showNotification(`Comanda #${comandaId} adicionada! Total: ${selectedComandas.length + 1} comanda(s)`, 'success');
    setComandaCodeInput('');
  };

  const removeComandaFromSelection = (comandaId: number) => {
    setSelectedComandas(prev => prev.filter(c => c.id !== comandaId));
    showNotification('Comanda removida da seleção.', 'info');
  };

  const clearMultiComandaSelection = () => {
    setSelectedComandas([]);
    setIsMultiComandaMode(false);
    showNotification('Seleção limpa.', 'info');
  };

  const handleActivateComanda = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && comandaCodeInput.trim() !== '') {
      const comandaId = comandaCodeInput.trim();
      
      if (isMultiComandaMode) {
        await addComandaToSelection(comandaId);
        return;
      }
      
      setIsLoading(true);
      console.log('Buscando comanda:', comandaId);
      
      // Primeiro busca por comanda aberta
      let { data: comanda, error } = await supabase
        .from('comandas')
        .select(`
          *,
          comanda_itens (*)
        `)
        .eq('identificador_cliente', comandaId)
        .eq('status', 'aberta')
        .maybeSingle();

      console.log('🔍 Busca comanda - Resposta:', comanda);
      console.log('📦 Busca comanda - Itens da relação:', comanda?.comanda_itens);

      if (error) {
        console.error('Erro ao buscar comanda:', error);
        showNotification('Erro ao buscar comanda.', 'error');
        setIsLoading(false);
        return;
      }
      
      // Se não encontrou comanda aberta, criar uma nova
      if (!comanda) {
        console.log('Comanda não encontrada, criando nova...');
        const { data: newComanda, error: createError } = await supabase
          .from('comandas')
          .insert({ 
            identificador_cliente: comandaId, 
            status: 'aberta',
            created_at: getCurrentBrazilianDateTime()
          })
          .select(`
            *,
            comanda_itens (*)
          `)
          .single();
        
        if (createError) {
          console.error('Erro ao criar comanda:', createError);
          showNotification('Erro ao criar nova comanda.', 'error');
          setIsLoading(false);
          return;
        }
        
        comanda = {
          ...newComanda,
          comanda_itens: newComanda.comanda_itens || []
        };
        showNotification(`Nova comanda #${comandaId} criada!`, 'success');
      } else {
        let itens = comanda.comanda_itens || [];
        
        // Fallback: se itens vieram vazios, buscar separadamente
        if (itens.length === 0) {
          console.log('⚠️ Itens vazios na relação, buscando separadamente...');
          const { data: itensSeparados, error: itensError } = await supabase
            .from('comanda_itens')
            .select('*')
            .eq('comanda_id', comanda.id);
          
          console.log('📦 Itens buscados separadamente:', itensSeparados, 'Erro:', itensError);
          
          if (!itensError && itensSeparados) {
            itens = itensSeparados;
          }
        }
        
        comanda = {
          ...comanda,
          comanda_itens: itens
        };
        showNotification(`Comanda #${comandaId} carregada com ${itens.length} item(s)!`, 'info');
      }

      console.log('✅ Comanda ativa:', comanda);
      setActiveComanda(comanda);
      setComandaCodeInput('');
      setIsLoading(false);
    }
  };


  const handleConfirmPayment = async (
    total: number, 
    formaPagamento: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'multiplo',
    paymentSplits?: PaymentSplit[],
    caixaId?: number,
    desconto?: number,
    descontoPercentual?: number,
    motivoDesconto?: string
  ) => {
    if (isProcessing) return;
    
    const comandasToProcess = isMultiComandaMode ? selectedComandas : (activeComanda ? [activeComanda] : []);
    
    if (comandasToProcess.length === 0) return;
    
    setIsLoading(true);
    
    try {
      console.log(`💳 Processando pagamento: ${comandasToProcess.length} comanda(s)`);
      console.log(`💰 Forma de pagamento: ${formaPagamento}`);
      
      if (desconto && desconto > 0) {
        console.log(`🏷️ Desconto aplicado: R$ ${desconto.toFixed(2)}`);
      }
      
      if (formaPagamento === 'multiplo' && paymentSplits) {
        console.log('🔀 Pagamento dividido:', paymentSplits);
      }
      
      const brazilianPaymentDateTime = getCurrentBrazilianDateTime();
      const allStockUpdates: any[] = [];
      const allLowStockAlerts: string[] = [];
      
      for (const comanda of comandasToProcess) {
        console.log(`📦 Processando comanda #${comanda.identificador_cliente}`);
        
        const stockResult = await processStockReduction(comanda);
        
        if (!stockResult.success) {
          throw new Error(`Erro ao processar estoque da comanda #${comanda.identificador_cliente}: ${stockResult.error}`);
        }
        
        allStockUpdates.push(...stockResult.stockUpdates);
        allLowStockAlerts.push(...stockResult.lowStockAlerts);
        
        const comandaTotal = comanda.comanda_itens.reduce(
          (acc, item) => acc + parseFloat(item.preco_unitario.toString()) * item.quantidade, 
          0
        );
        
        const updateData: any = { 
          status: 'paga', 
          total: comandaTotal, 
          data_pagamento: brazilianPaymentDateTime,
          forma_pagamento: formaPagamento,
          caixa_id: caixaId || null
        };
        
        if (desconto && desconto > 0) {
          updateData.desconto = desconto;
          if (descontoPercentual) {
            updateData.desconto_percentual = descontoPercentual;
          }
          if (motivoDesconto && motivoDesconto.trim()) {
            updateData.motivo_desconto = motivoDesconto;
          }
        }
        
        if (formaPagamento === 'multiplo' && paymentSplits) {
          updateData.pagamentos_divididos = paymentSplits;
        }
        
        const { error } = await supabase
          .from('comandas')
          .update(updateData)
          .eq('id', comanda.id);

        if (error) {
          throw new Error(`Erro ao processar pagamento da comanda #${comanda.identificador_cliente}: ${error.message}`);
        }
      }

      console.log('✅ Pagamento processado com sucesso');
      
      await fetchProducts();
      
      const comandasIds = comandasToProcess.map(c => `#${c.identificador_cliente}`).join(', ');
      let message = `Pagamento de ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} confirmado!`;
      
      if (desconto && desconto > 0) {
        message += ` (Desconto: R$ ${desconto.toFixed(2)})`;
      }
      
      message += ` Comandas: ${comandasIds}`;
      
      if (formaPagamento === 'multiplo' && paymentSplits) {
        message += ` (${paymentSplits.length} formas de pagamento)`;
      }
      
      if (allStockUpdates.length > 0) {
        message += ` Baixa realizada em ${allStockUpdates.length} produto(s).`;
      }
      
      if (allLowStockAlerts.length > 0) {
        toast.warning(`Estoque baixo: ${[...new Set(allLowStockAlerts)].join(', ')}`);
      }

      showNotification(message, 'success');
      
      setActiveComanda(null);
      setSelectedComandas([]);
      setIsMultiComandaMode(false);
      setPaymentModalOpen(false);
      
    } catch (error) {
      console.error('❌ Erro no processamento do pagamento:', error);
      showNotification(
        error instanceof Error ? error.message : 'Erro ao processar pagamento', 
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = () => {
    navigate('/relatorio');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen font-sans text-gray-800 p-4">
      <NotificationModal 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: 'info' })} 
      />
      
      {isPaymentModalOpen && (
        <PaymentModal 
          comanda={activeComanda}
          multiComandas={selectedComandas}
          isMultiMode={isMultiComandaMode}
          onClose={() => setPaymentModalOpen(false)} 
          onConfirmPayment={handleConfirmPayment} 
        />
      )}
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      <main className="max-w-screen-2xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-700 mb-2 flex items-center gap-2">
              🍽️ Parceria Com IA - PDV
            </h1>
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                id="comanda-input"
                type="text" 
                value={comandaCodeInput} 
                onChange={(e) => setComandaCodeInput(e.target.value)} 
                onKeyDown={handleActivateComanda} 
                placeholder={isMultiComandaMode 
                  ? "Ler comandas para unir (pressione Enter após cada uma)" 
                  : "Ler código da COMANDA ou 300 avulso"
                }
                className="w-full md:w-96 bg-white border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                aria-label="Campo para inserir código da comanda"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCaixaModal(true)}
              className="bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Wallet size={18} />
              Caixa
            </button>
            <button
              onClick={() => {
                setIsMultiComandaMode(!isMultiComandaMode);
                if (!isMultiComandaMode) {
                  setActiveComanda(null);
                  showNotification('Modo múltiplas comandas ativado! Leia as comandas que deseja unir.', 'info');
                } else {
                  setSelectedComandas([]);
                  showNotification('Modo comanda única ativado.', 'info');
                }
              }}
              className={`
                font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg
                ${isMultiComandaMode 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }
              `}
            >
              <Receipt size={18} />
              {isMultiComandaMode ? 'Modo Múltiplo: ON' : 'Modo Múltiplo: OFF'}
            </button>
            <button 
              onClick={() => navigate('/estoque')} 
              className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <Package size={18} />
              Estoque
            </button>
            <button 
              onClick={handleGenerateReport} 
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              <FileText size={18} />
              Relatório
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="lg:col-span-1">
            <InputPanel 
              produtos={produtos} 
              onAddProduto={handleAddProduto} 
              onAddPratoPorPeso={handleAddPratoPorPeso} 
              onAddMarmitex={handleAddMarmitex}
              activeComandaId={activeComanda?.id}
            />
          </div>
          <div className="lg:col-span-1">
            <OrderSummary 
              comanda={isMultiComandaMode ? null : activeComanda}
              multiComandas={isMultiComandaMode ? selectedComandas : []}
              isMultiMode={isMultiComandaMode}
              onRemoveItem={handleRemoveItem}
              onRemoveComanda={removeComandaFromSelection}
              onClearComanda={handleClearComanda}
              onClearMultiSelection={clearMultiComandaSelection}
              onPagar={() => setPaymentModalOpen(true)}
              onUpdateQuantity={handleUpdateQuantity}
              produtos={produtos}
            />
          </div>
        </div>
      </main>
      
      <CaixaModal 
        open={showCaixaModal} 
        onOpenChange={setShowCaixaModal} 
      />
    </div>
  );
}
