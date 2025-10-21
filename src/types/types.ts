
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
  atalho_rapido?: boolean;
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

export interface Categoria {
  id: number;
  nome: string;
  emoji: string;
  ativo: boolean;
  created_at: string;
}

export interface ComandaItem {
  id: number;
  created_at: string;
  comanda_id: number;
  produto_id: number | null;
  quantidade: number;
  preco_unitario: number;
  descricao?: string;
  tipo_item?: 'produto' | 'prato_por_quilo' | 'marmitex';
}

export interface PaymentSplit {
  forma_pagamento: 'dinheiro' | 'pix' | 'debito' | 'credito';
  valor: number;
  troco?: number;
}

export interface Comanda {
  id: number;
  created_at: string;
  identificador_cliente: string;
  status: 'aberta' | 'paga' | 'cancelada';
  total: number | null;
  data_pagamento: string | null;
  forma_pagamento?: 'dinheiro' | 'pix' | 'debito' | 'credito' | 'multiplo' | null;
  pagamentos_divididos?: PaymentSplit[];
  comanda_itens: ComandaItem[];
  caixa_id?: number | null;
}

export interface Caixa {
  id: number;
  created_at: string;
  numero_caixa: 1 | 2 | 3;
  nome_operador: string;
  valor_abertura: number;
  status: 'aberto' | 'fechado';
  data_abertura: string | null;
  data_fechamento: string | null;
}

export interface CaixaRetirada {
  id: number;
  created_at: string;
  caixa_id: number;
  valor: number;
  observacao?: string;
  data_retirada: string;
}

export interface CaixaComRetiradas extends Caixa {
  caixa_retiradas: CaixaRetirada[];
}
