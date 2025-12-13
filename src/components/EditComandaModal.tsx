import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Comanda, ComandaItem } from '@/types/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditComandaModalProps {
  comanda: Comanda;
  produtos: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditComandaModal: React.FC<EditComandaModalProps> = ({
  comanda,
  produtos,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [items, setItems] = useState<ComandaItem[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [motivoDesconto, setMotivoDesconto] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'debito' | 'credito' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (comanda) {
      setItems(comanda.comanda_itens || []);
      setDesconto(comanda.desconto || 0);
      setMotivoDesconto(comanda.motivo_desconto || '');
      setFormaPagamento(comanda.forma_pagamento === 'multiplo' ? null : comanda.forma_pagamento || null);
    }
  }, [comanda]);

  const getProductName = (produtoId: number | null, descricao?: string) => {
    if (!produtoId) return descricao || 'Prato por Quilo';
    const produto = produtos.find((p) => p.id === produtoId);
    return produto?.nome || 'Produto não encontrado';
  };

  const getProductEmoji = (produtoId: number | null) => {
    if (!produtoId) return '🍽️';
    const produto = produtos.find((p) => p.id === produtoId);
    return produto?.img || '🍽️';
  };

  const calculateNewTotal = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantidade * item.preco_unitario;
    }, 0);
    return subtotal - desconto;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const newTotal = calculateNewTotal();

      // Atualizar comanda
      const { error: comandaError } = await supabase
        .from('comandas')
        .update({
          desconto,
          motivo_desconto: motivoDesconto,
          total: newTotal,
          forma_pagamento: formaPagamento,
        })
        .eq('id', comanda.id);

      if (comandaError) throw comandaError;

      // Atualizar itens
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('comanda_itens')
          .update({
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
          })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      toast.success('Comanda atualizada com sucesso');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar comanda:', error);
      toast.error('Erro ao atualizar comanda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: 'quantidade' | 'preco_unitario', value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            ✏️ Editar Comanda #{comanda.identificador_cliente}
          </DialogTitle>
          <DialogDescription>
            Edite as quantidades, preços e descontos da comanda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Itens da Comanda</Label>
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex gap-3 items-center p-3 bg-muted rounded-lg"
              >
                <span className="text-2xl">{getProductEmoji(item.produto_id)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getProductName(item.produto_id, item.descricao)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) =>
                        handleItemChange(index, 'quantidade', parseInt(e.target.value) || 1)
                      }
                      className="w-20"
                    />
                  </div>
                  <span className="text-muted-foreground">x</span>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.preco_unitario}
                      onChange={(e) =>
                        handleItemChange(index, 'preco_unitario', parseFloat(e.target.value) || 0)
                      }
                      className="w-28"
                    />
                  </div>
                  <div className="text-right min-w-[80px]">
                    <Label className="text-xs block">Subtotal</Label>
                    <p className="text-sm font-semibold">
                      {(item.quantidade * item.preco_unitario).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>Forma de Pagamento</Label>
            <Select
              value={formaPagamento || ''}
              onValueChange={(value) => setFormaPagamento(value as 'dinheiro' | 'pix' | 'debito' | 'credito')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                <SelectItem value="pix">📱 Pix</SelectItem>
                <SelectItem value="debito">💳 Cartão Débito</SelectItem>
                <SelectItem value="credito">🏦 Cartão Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="desconto">Desconto (R$)</Label>
              <Input
                id="desconto"
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do Desconto</Label>
              <Input
                id="motivo"
                value={motivoDesconto}
                onChange={(e) => setMotivoDesconto(e.target.value)}
                placeholder="Motivo (opcional)"
              />
            </div>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-2xl">
                {calculateNewTotal().toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
