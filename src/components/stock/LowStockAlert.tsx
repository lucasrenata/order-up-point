import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LowStockProduct } from '@/types/types';

interface LowStockAlertProps {
  lowStockProducts: LowStockProduct[];
}

export function LowStockAlert({ lowStockProducts }: LowStockAlertProps) {
  if (lowStockProducts.length === 0) return null;

  return (
    <Card className="border-destructive bg-destructive/5 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Alerta de Estoque Baixo ({lowStockProducts.length} produtos)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lowStockProducts.slice(0, 6).map(({ produto, quantidade_faltante }) => (
            <div
              key={produto.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{produto.img}</span>
                <div>
                  <div className="font-medium text-sm">{produto.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    Atual: {produto.estoque_atual} | Mín: {produto.estoque_minimo}
                  </div>
                </div>
              </div>
              <Badge variant="destructive" className="text-xs">
                Falta {quantidade_faltante}
              </Badge>
            </div>
          ))}
        </div>
        {lowStockProducts.length > 6 && (
          <p className="text-sm text-muted-foreground mt-3">
            E mais {lowStockProducts.length - 6} produtos com estoque baixo...
          </p>
        )}
      </CardContent>
    </Card>
  );
}