
export const convertUTCToBrazilianTime = (utcDate: string): string => {
  const date = new Date(utcDate);
  // Converter para horário brasileiro (UTC-3)
  const brazilianTime = new Date(date.getTime() - (3 * 60 * 60 * 1000));
  return brazilianTime.toISOString().split('T')[0];
};

export const formatBrazilianDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
};

export const formatBrazilianDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};

export const getBrazilianDateRange = (date: string) => {
  return {
    start: `${date}T00:00:00-03:00`,
    end: `${date}T23:59:59-03:00`
  };
};
