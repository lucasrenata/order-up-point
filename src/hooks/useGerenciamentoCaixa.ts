import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Caixa, CaixaRetirada, CaixaEntrada, CaixaPagamentoReserva } from '@/types/types';
import { toast } from '@/hooks/use-toast';

export const useGerenciamentoCaixa = () => {
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [retiradas, setRetiradas] = useState<CaixaRetirada[]>([]);
  const [entradas, setEntradas] = useState<CaixaEntrada[]>([]);
  const [pagamentosReserva, setPagamentosReserva] = useState<CaixaPagamentoReserva[]>([]);
  const [vendasDinheiro, setVendasDinheiro] = useState(0);
  const [vendasPorForma, setVendasPorForma] = useState<Record<string, number>>({});
  const [totalComandas, setTotalComandas] = useState(0);
  const [loading, setLoading] = useState(false);

  // Buscar status atual dos 3 caixas
  const fetchCaixas = async () => {
    try {
      setLoading(true);
      
      // Buscar o último registro de cada caixa
      const { data, error } = await supabase
        .from('caixas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Pegar apenas o registro mais recente de cada caixa
      const caixasMap = new Map<number, Caixa>();
      data?.forEach((caixa) => {
        if (!caixasMap.has(caixa.numero_caixa)) {
          caixasMap.set(caixa.numero_caixa, caixa as Caixa);
        }
      });

      // Garantir que sempre temos os 3 caixas (criar registros fechados se não existirem)
      const caixasArray: Caixa[] = [];
      for (let i = 1; i <= 3; i++) {
        const caixa = caixasMap.get(i);
        if (caixa) {
          caixasArray.push(caixa);
        } else {
          // Criar um caixa fechado fictício para exibição
          caixasArray.push({
            id: 0,
            created_at: new Date().toISOString(),
            numero_caixa: i as 1 | 2 | 3,
            nome_operador: '',
            valor_abertura: 0,
            status: 'fechado',
            data_abertura: null,
            data_fechamento: null,
          });
        }
      }

      setCaixas(caixasArray.sort((a, b) => a.numero_caixa - b.numero_caixa));
    } catch (error: any) {
      toast({
        title: 'Erro ao buscar caixas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir caixa
  const abrirCaixa = async (
    numeroCaixa: 1 | 2 | 3,
    nomeOperador: string,
    valorAbertura: number
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('caixas')
        .insert({
          numero_caixa: numeroCaixa,
          nome_operador: nomeOperador,
          valor_abertura: valorAbertura,
          status: 'aberto',
          data_abertura: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Caixa aberto com sucesso',
        description: `Caixa ${numeroCaixa} - ${nomeOperador}`,
      });

      await fetchCaixas();
      return data;
    } catch (error: any) {
      toast({
        title: 'Erro ao abrir caixa',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fechar caixa
  const fecharCaixa = async (caixaId: number) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('caixas')
        .update({
          status: 'fechado',
          data_fechamento: new Date().toISOString(),
        })
        .eq('id', caixaId);

      if (error) throw error;

      toast({
        title: 'Caixa fechado com sucesso',
      });

      await fetchCaixas();
    } catch (error: any) {
      toast({
        title: 'Erro ao fechar caixa',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar retirada
  const adicionarRetirada = async (
    caixaId: number,
    valor: number,
    observacao?: string
  ) => {
    try {
      setLoading(true);

      const { error } = await supabase.from('caixa_retiradas').insert({
        caixa_id: caixaId,
        valor: valor,
        observacao: observacao || '',
        data_retirada: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Retirada registrada',
        description: `R$ ${valor.toFixed(2)}`,
      });

      await fetchRetiradas(caixaId);
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar retirada',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar entrada
  const adicionarEntrada = async (
    caixaId: number,
    valor: number,
    observacao?: string
  ) => {
    try {
      setLoading(true);

      const { error } = await supabase.from('caixa_entradas').insert({
        caixa_id: caixaId,
        valor: valor,
        observacao: observacao || '',
        data_entrada: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Entrada registrada',
        description: `R$ ${valor.toFixed(2)}`,
      });

      await fetchRetiradas(caixaId);
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar entrada',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar pagamento de reserva
  const adicionarPagamentoReserva = async (
    caixaId: number,
    valor: number,
    formaPagamento: 'dinheiro' | 'pix' | 'debito' | 'credito',
    clienteNome: string,
    observacao?: string
  ) => {
    try {
      setLoading(true);

      const { error } = await supabase.from('caixa_pagamentos_reserva').insert({
        caixa_id: caixaId,
        valor: valor,
        forma_pagamento: formaPagamento,
        cliente_nome: clienteNome,
        observacao: observacao || '',
        data_pagamento: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Pagamento de reserva registrado',
        description: `${clienteNome} - R$ ${valor.toFixed(2)} (${formaPagamento})`,
      });

      await fetchRetiradas(caixaId);
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar pagamento',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Buscar vendas em dinheiro de um caixa
  const fetchVendasDinheiro = async (caixaId: number): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .select('total, forma_pagamento, pagamentos_divididos')
        .eq('caixa_id', caixaId)
        .eq('status', 'paga');

      if (error) throw error;

      let totalDinheiro = 0;

      data?.forEach((comanda) => {
        // Caso 1: Pagamento único em dinheiro
        if (comanda.forma_pagamento === 'dinheiro') {
          totalDinheiro += comanda.total || 0;
        }
        // Caso 2: Pagamento dividido (multiplo)
        else if (comanda.forma_pagamento === 'multiplo' && comanda.pagamentos_divididos) {
          comanda.pagamentos_divididos.forEach((pagamento: any) => {
            if (pagamento.forma_pagamento === 'dinheiro') {
              totalDinheiro += pagamento.valor;
            }
          });
        }
      });

      return totalDinheiro;
    } catch (error: any) {
      console.error('Erro ao buscar vendas em dinheiro:', error);
      return 0;
    }
  };

  // Buscar pagamentos de reserva
  const fetchPagamentosReserva = async (caixaId: number) => {
    try {
      const { data, error } = await supabase
        .from('caixa_pagamentos_reserva')
        .select('*')
        .eq('caixa_id', caixaId)
        .order('data_pagamento', { ascending: false });

      if (error) throw error;

      setPagamentosReserva((data as CaixaPagamentoReserva[]) || []);
    } catch (error: any) {
      console.error('Erro ao buscar pagamentos de reserva:', error);
    }
  };

  // Buscar todas as vendas de um caixa (por forma de pagamento)
  const fetchVendasPorForma = async (caixaId: number) => {
    try {
      const { data: comandasData, error: comandasError } = await supabase
        .from('comandas')
        .select('total, forma_pagamento, pagamentos_divididos')
        .eq('caixa_id', caixaId)
        .eq('status', 'paga');

      if (comandasError) throw comandasError;

      const { data: reservasData, error: reservasError } = await supabase
        .from('caixa_pagamentos_reserva')
        .select('valor, forma_pagamento')
        .eq('caixa_id', caixaId);

      if (reservasError) throw reservasError;

      const vendas: Record<string, number> = {
        dinheiro: 0,
        pix: 0,
        debito: 0,
        credito: 0,
      };

      let totalComandasProcessadas = 0;

      comandasData?.forEach((comanda) => {
        totalComandasProcessadas++;
        
        // Caso 1: Pagamento único
        if (comanda.forma_pagamento !== 'multiplo') {
          vendas[comanda.forma_pagamento] += comanda.total || 0;
        }
        // Caso 2: Pagamento dividido (multiplo)
        else if (comanda.forma_pagamento === 'multiplo' && comanda.pagamentos_divididos) {
          comanda.pagamentos_divididos.forEach((pagamento: any) => {
            if (vendas[pagamento.forma_pagamento] !== undefined) {
              vendas[pagamento.forma_pagamento] += pagamento.valor;
            }
          });
        }
      });

      // Adicionar pagamentos de reserva
      reservasData?.forEach((reserva) => {
        if (vendas[reserva.forma_pagamento] !== undefined) {
          vendas[reserva.forma_pagamento] += reserva.valor;
        }
      });

      setVendasPorForma(vendas);
      setTotalComandas(totalComandasProcessadas);
    } catch (error: any) {
      console.error('Erro ao buscar vendas por forma:', error);
    }
  };

  // Buscar entradas de um caixa
  const fetchEntradas = async (caixaId: number) => {
    try {
      const { data, error } = await supabase
        .from('caixa_entradas')
        .select('*')
        .eq('caixa_id', caixaId)
        .order('data_entrada', { ascending: false });

      if (error) throw error;

      setEntradas((data as CaixaEntrada[]) || []);
    } catch (error: any) {
      console.error('Erro ao buscar entradas:', error);
    }
  };

  // Buscar retiradas de um caixa
  const fetchRetiradas = async (caixaId: number) => {
    try {
      const { data, error } = await supabase
        .from('caixa_retiradas')
        .select('*')
        .eq('caixa_id', caixaId)
        .order('data_retirada', { ascending: false });

      if (error) throw error;

      setRetiradas((data as CaixaRetirada[]) || []);
      
      // Buscar entradas
      await fetchEntradas(caixaId);
      
      // Buscar pagamentos de reserva
      await fetchPagamentosReserva(caixaId);
      
      // Buscar vendas em dinheiro
      const totalVendas = await fetchVendasDinheiro(caixaId);
      setVendasDinheiro(totalVendas);

      // Buscar vendas por todas as formas
      await fetchVendasPorForma(caixaId);
    } catch (error: any) {
      toast({
        title: 'Erro ao buscar movimentações',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchCaixas();
  }, []);

  return {
    caixas,
    retiradas,
    entradas,
    pagamentosReserva,
    vendasDinheiro,
    vendasPorForma,
    totalComandas,
    loading,
    fetchCaixas,
    abrirCaixa,
    fecharCaixa,
    adicionarRetirada,
    adicionarEntrada,
    adicionarPagamentoReserva,
    fetchRetiradas,
  };
};
