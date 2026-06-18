import axios from 'axios';

export const api = axios.create({
  // baseURL: 'http://localhost:5000',
  baseURL: '/',
  timeout: 15000,
});

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return typeof message === 'string' ? message : error.message;
  }

  return error instanceof Error ? error.message : 'Unexpected error';
};

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export const numberFormatter = new Intl.NumberFormat('en-US');

export const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
