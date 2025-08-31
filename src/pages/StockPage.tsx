import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProductForm } from '@/components/stock/ProductForm';
import { StockTable } from '@/components/stock/StockTable';
import { LowStockAlert } from '@/components/stock/LowStockAlert';
import { ShoppingListGenerator } from '@/components/stock/ShoppingListGenerator';
import { supabase } from '@/lib/supabase';
import { Product, LowStockProduct } from '@/types/types';
import { toast } from 'sonner';

const MOVES_TABLE = 'estoque_movimentacoes';

export default function StockPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['bebidas', 'doces', 'terços', 'variados'];

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar produtos');
      console.error(error);
    } else {
      const productsWithDefaults = (data || []).map(product => ({
        ...product,
        estoque_atual: product.estoque_atual ?? 0,
        estoque_minimo: product.estoque_minimo ?? 5,
        estoque_maximo: product.estoque_maximo ?? 100,
        unidade_medida: product.unidade_medida ?? 'unidade',
        ativo: product.ativo ?? true
      }));
      setProducts(productsWithDefaults);
      updateLowStockProducts(productsWithDefaults);
    }
    setIsLoading(false);
  };

  const updateLowStockProducts = (productList: Product[]) => {
    const lowStock = productList
      .filter(product => 
        product.ativo && 
        (product.estoque_atual ?? 0) <= (product.estoque_minimo ?? 0)
      )
      .map(product => ({
        produto: product,
        quantidade_faltante: (product.estoque_minimo ?? 0) - (product.estoque_atual ?? 0)
      }));
    setLowStockProducts(lowStock);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoria === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  const deleteMovementsByProduct = async (productId: number) => {
    try {
      const { error } = await supabase
        .from(MOVES_TABLE)
        .delete()
        .eq('produto_id', productId);

      if (error) {
        console.error('Erro ao limpar movimentações:', error);
        toast.warning('Não foi possível limpar as movimentações. Verifique as permissões da tabela.');
        return false;
      }

      console.log(`Movimentações limpas para produto ID: ${productId}`);
      toast.success('Movimentações limpas para este produto');
      return true;
    } catch (error) {
      console.error('Erro ao limpar movimentações:', error);
      toast.warning('Erro ao limpar movimentações do produto');
      return false;
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        const previousStock = editingProduct.estoque_atual ?? 0;
        const newStock = typeof productData.estoque_atual === 'number' ? productData.estoque_atual : previousStock;
        
        console.log(`Atualização de estoque - Anterior: ${previousStock}, Novo: ${newStock}`);

        const { error } = await supabase
          .from('produtos')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        
        // Se houve reposição de estoque (aumento), limpar movimentações
        if (newStock > previousStock) {
          console.log('Reposição detectada, limpando movimentações...');
          await deleteMovementsByProduct(editingProduct.id);
        }
        
        toast.success('Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert(productData);

        if (error) throw error;
        toast.success('Produto cadastrado com sucesso!');
      }

      setIsProductFormOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao salvar produto');
      console.error(error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      // Primeiro limpar as movimentações relacionadas ao produto
      await deleteMovementsByProduct(productId);
      
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      toast.success('Produto deletado com sucesso!');
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao deletar produto');
      console.error(error);
    }
  };

  const getStockStatus = (product: Product) => {
    const current = product.estoque_atual ?? 0;
    const min = product.estoque_minimo ?? 0;
    const max = product.estoque_maximo ?? 0;

    if (current <= min) return 'low';
    if (current >= max * 0.8) return 'high';
    return 'normal';
  };

  const getStockBadge = (product: Product) => {
    const status = getStockStatus(product);
    const current = product.estoque_atual ?? 0;

    switch (status) {
      case 'low':
        return <Badge variant="destructive">Baixo ({current})</Badge>;
      case 'high':
        return <Badge className="bg-green-600 text-white">Bom ({current})</Badge>;
      default:
        return <Badge variant="secondary">Normal ({current})</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Estoque</h1>
            </div>
          </div>
          <Button onClick={() => setIsProductFormOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.filter(p => p.ativo).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products
                  .filter(p => p.ativo)
                  .reduce((total, p) => total + (p.preco * (p.estoque_atual ?? 0)), 0)
                  .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <ShoppingListGenerator lowStockProducts={lowStockProducts} />
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <LowStockAlert lowStockProducts={lowStockProducts} />
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <StockTable
          products={filteredProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          getStockBadge={getStockBadge}
          isLoading={isLoading}
        />

        {/* Product Form Modal */}
        {isProductFormOpen && (
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSave={handleSaveProduct}
            onCancel={() => {
              console.log('ProductForm onCancel called'); // Debug log
              try {
                setIsProductFormOpen(false);
                setEditingProduct(null);
              } catch (error) {
                console.error('Erro ao fechar modal:', error);
                // Fallback: forçar fechamento após pequeno delay
                setTimeout(() => {
                  setIsProductFormOpen(false);
                  setEditingProduct(null);
                }, 100);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}