
export interface Product {
  id: number;
  nome: string;
  preco: number;
  categoria: 'bebidas' | 'sobremesas';
  barcode?: string;
  img: string;
}

export interface ComandaItem {
  id: number;
  comanda_id: number;
  produto_id: number | null;
  quantidade: number;
  preco_unitario: number;
  descricao?: string;
  produtos?: Product | null;
}

export interface Comanda {
  id: number;
  identificador_cliente: string;
  status: 'aberta' | 'paga';
  comanda_itens: ComandaItem[];
  total: number;
  data_pagamento: string | null;
}
