
import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

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
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const quickFilters = [
    { label: 'Hoje', value: today },
    { label: 'Ontem', value: yesterday },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400" size={20} />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>
          
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
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
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
