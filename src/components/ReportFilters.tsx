
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { getCurrentBrazilianDate, getYesterdayBrazilianDate } from '../utils/dateUtils';
import { BrazilianDatePicker } from './BrazilianDatePicker';

interface ReportFiltersProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  isLoading: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ 
  selectedDate, 
  onDateChange, 
  isLoading 
}) => {
  const today = getCurrentBrazilianDate();
  const yesterday = getYesterdayBrazilianDate();

  const quickFilters = [
    { label: 'Hoje', value: today },
    { label: 'Ontem', value: yesterday },
  ];

  console.log('🇧🇷 Filtros de data:', {
    hoje: today,
    ontem: yesterday,
    selectedDate
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Período:</span>
          
          <div className="flex gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => onDateChange(filter.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedDate === filter.value
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={isLoading}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BrazilianDatePicker
            value={selectedDate}
            onChange={onDateChange}
            disabled={isLoading}
            placeholder="Selecione uma data"
            className="w-[200px]"
          />
          
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw size={16} className="animate-spin" />
              Carregando...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
