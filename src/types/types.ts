
export interface Product {
  id: number;
  created_at: string;
  nome: string;
  preco: number;
  categoria: string;
  barcode?: string;
  img: string;
  estoque_atual?: number;
  estoque_minimo?: number;
  estoque_maximo?: number;
  unidade_medida?: string;
  fornecedor?: string;
  descricao?: string;
  ativo?: boolean;
}

export interface StockMovement {
  id: number;
  produto_id: number;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo?: string;
  created_at: string;
}

export interface LowStockProduct {
  produto: Product;
  quantidade_faltante: number;
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
  forma_pagamento?: 'dinheiro' | 'pix' | 'debito' | 'credito' | null;
  comanda_itens: ComandaItem[];
}
