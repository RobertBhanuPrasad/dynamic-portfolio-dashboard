export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2)}%`;
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
};
