
// Funções utilitárias para trabalhar com datas no timezone brasileiro (UTC-3)

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data UTC para string no formato brasileiro (dd/mm/yyyy)
 */
export const formatBrazilianDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: BRAZIL_TIMEZONE
  });
};

/**
 * Converte uma data UTC para string no formato brasileiro com horário (dd/mm/yyyy HH:mm)
 */
export const formatBrazilianDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BRAZIL_TIMEZONE
  });
};

/**
 * Obter a data atual no timezone brasileiro no formato yyyy-mm-dd
 */
export const getCurrentBrazilianDate = (): string => {
  const now = new Date();
  
  // Usar Intl.DateTimeFormat para obter a data brasileira
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const brazilianDate = formatter.format(now);
  console.log(`🇧🇷 Data atual brasileira: ${brazilianDate}`);
  
  return brazilianDate;
};

/**
 * Obter a data de ontem no timezone brasileiro no formato yyyy-mm-dd
 */
export const getYesterdayBrazilianDate = (): string => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const yesterdayDate = formatter.format(yesterday);
  console.log(`🇧🇷 Data de ontem brasileira: ${yesterdayDate}`);
  
  return yesterdayDate;
};

/**
 * Obter a data/hora atual no timezone brasileiro no formato ISO
 * Esta função garante que o timestamp seja sempre no horário brasileiro real
 */
export const getCurrentBrazilianDateTime = (): string => {
  const now = new Date();
  
  // Usar toLocaleString para obter o horário brasileiro atual
  const brazilianTime = now.toLocaleString('sv-SE', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Converter para formato ISO mantendo o horário brasileiro
  const isoString = `${brazilianTime}.000Z`;
  
  console.log(`🇧🇷 Data/hora atual brasileira (ISO): ${isoString}`);
  console.log(`🇧🇷 Horário brasileiro local: ${now.toLocaleString('pt-BR', { timeZone: BRAZIL_TIMEZONE })}`);
  
  return isoString;
};

/**
 * Converter data UTC para data brasileira no formato yyyy-mm-dd
 */
export const convertUTCToBrazilianDate = (utcDate: string): string => {
  const date = new Date(utcDate);
  
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(date);
};

/**
 * Obter range UTC que corresponde a um dia brasileiro completo
 */
export const getBrazilianDateRange = (brazilianDate: string) => {
  console.log(`🔍 Calculando range UTC para data brasileira: ${brazilianDate}`);
  
  // Criar início e fim do dia no timezone brasileiro
  const startDate = new Date(`${brazilianDate}T00:00:00.000-03:00`);
  const endDate = new Date(`${brazilianDate}T23:59:59.999-03:00`);
  
  const result = {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
  
  console.log(`🌍 Range UTC final:`);
  console.log(`  Início: ${result.start} (${startDate.toLocaleString('pt-BR', { timeZone: BRAZIL_TIMEZONE })})`);
  console.log(`  Fim: ${result.end} (${endDate.toLocaleString('pt-BR', { timeZone: BRAZIL_TIMEZONE })})`);
  
  return result;
};

/**
 * Converter Date para formato brasileiro yyyy-mm-dd
 */
export const dateToStringBrazilian = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(date);
};

/**
 * Converter string yyyy-mm-dd para Date no timezone brasileiro
 */
export const stringToDateBrazilian = (dateString: string): Date => {
  // Criar date assumindo timezone brasileiro
  const date = new Date(`${dateString}T12:00:00`);
  return date;
};

/**
 * Formatar data diretamente sem conversão de timezone (dados já estão em UTC-3)
 */
export const formatBrazilianDateDirect = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatar data e hora diretamente sem conversão de timezone (dados já estão em UTC-3)
 */
export const formatBrazilianDateTimeDirect = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Obter range direto para busca (dados já estão em UTC-3)
 */
export const getBrazilianDateRangeDirect = (brazilianDate: string) => {
  console.log(`🔍 Calculando range direto para data brasileira: ${brazilianDate}`);
  
  // Como os dados já estão em UTC-3, usamos range direto
  const startDate = `${brazilianDate}T00:00:00.000`;
  const endDate = `${brazilianDate}T23:59:59.999`;
  
  const result = {
    start: startDate,
    end: endDate
  };
  
  console.log(`🌍 Range direto (dados já em UTC-3):`);
  console.log(`  Início: ${result.start}`);
  console.log(`  Fim: ${result.end}`);
  
  return result;
};
