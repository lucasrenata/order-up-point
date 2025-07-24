
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  getCurrentBrazilianDate, 
  stringToDateBrazilian, 
  dateToStringBrazilian 
} from '../utils/dateUtils';

interface BrazilianDatePickerProps {
  value: string; // yyyy-mm-dd format
  onChange: (date: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const BrazilianDatePicker: React.FC<BrazilianDatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Selecione uma data',
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Converter string para Date
  const selectedDate = value ? stringToDateBrazilian(value) : undefined;
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const brazilianDateString = dateToStringBrazilian(date);
      onChange(brazilianDateString);
      setIsOpen(false);
    }
  };

  const displayText = selectedDate 
    ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={ptBR}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};
