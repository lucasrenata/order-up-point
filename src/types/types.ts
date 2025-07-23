
export interface Product {
  id: number;
  created_at: string;
  nome: string;
  preco: number;
  categoria: string;
  barcode?: string;
  img: string;
}

export interface ComandaItem {
  id: number;
  created_at: string;
  comanda_id: number;
  produto_id: number | null;
  quantidade: number;
  preco_unitario: number;
  descricao?: string;
}

export interface Comanda {
  id: number;
  created_at: string;
  identificador_cliente: string;
  status: 'aberta' | 'paga' | 'cancelada';
  total: number | null;
  data_pagamento: string | null;
  comanda_itens: ComandaItem[];
}
