import React, { useState, useEffect } from 'react';
import { X, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/types/types';

interface ProductFormProps {
  product?: Product | null;
  categories: string[];
  onSave: (product: Partial<Product>) => void;
  onCancel: () => void;
}

export function ProductForm({ product, categories, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    preco: 0,
    categoria: '',
    barcode: '',
    img: '📦',
    estoque_atual: 0,
    estoque_minimo: 5,
    estoque_maximo: 100,
    unidade_medida: 'unidade',
    fornecedor: '',
    descricao: '',
    ativo: true
  });

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        nome: product.nome || '',
        preco: product.preco || 0,
        categoria: product.categoria || '',
        barcode: product.barcode || '',
        img: product.img || '📦',
        estoque_atual: product.estoque_atual ?? 0,
        estoque_minimo: product.estoque_minimo ?? 5,
        estoque_maximo: product.estoque_maximo ?? 100,
        unidade_medida: product.unidade_medida ?? 'unidade',
        fornecedor: product.fornecedor || '',
        descricao: product.descricao || '',
        ativo: product.ativo ?? true
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ProductForm submit called'); // Debug log
    try {
      onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const handleScanBarcode = async () => {
    setIsScanning(true);
    try {
      // Simular escaneamento de código de barras
      // Em um app real, você usaria a API de câmera
      const result = prompt('Digite o código de barras:');
      if (result) {
        setFormData(prev => ({ ...prev, barcode: result }));
      }
    } catch (error) {
      console.error('Erro ao escanear código de barras:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const unitOptions = [
    { value: 'unidade', label: 'Unidade' },
    { value: 'kg', label: 'Quilograma' },
    { value: 'litro', label: 'Litro' },
    { value: 'caixa', label: 'Caixa' },
    { value: 'pacote', label: 'Pacote' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {product ? 'Editar Produto' : 'Novo Produto'}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('ProductForm close button clicked'); // Debug log
                onCancel();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Coca-Cola 350ml"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco">Preço *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="img">Emoji</Label>
                <Input
                  id="img"
                  value={formData.img}
                  onChange={(e) => setFormData(prev => ({ ...prev, img: e.target.value }))}
                  placeholder="📦"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    placeholder="Digite ou escaneie"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleScanBarcode}
                    disabled={isScanning}
                  >
                    <Scan className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade_medida">Unidade de Medida</Label>
                <Select
                  value={formData.unidade_medida}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unidade_medida: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque_atual">Estoque Atual</Label>
                <Input
                  id="estoque_atual"
                  type="number"
                  min="0"
                  value={formData.estoque_atual}
                  onChange={(e) => setFormData(prev => ({ ...prev, estoque_atual: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  min="0"
                  value={formData.estoque_minimo}
                  onChange={(e) => setFormData(prev => ({ ...prev, estoque_minimo: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque_maximo">Estoque Máximo</Label>
                <Input
                  id="estoque_maximo"
                  type="number"
                  min="0"
                  value={formData.estoque_maximo}
                  onChange={(e) => setFormData(prev => ({ ...prev, estoque_maximo: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                  placeholder="Nome do fornecedor"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Informações adicionais sobre o produto"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo">Produto ativo</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {product ? 'Atualizar' : 'Cadastrar'} Produto
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('ProductForm cancel button clicked'); // Debug log
                  onCancel();
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}