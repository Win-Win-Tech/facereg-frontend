import httpClient from './httpClient';

export const generatePayroll = (month) =>
  httpClient.post('/generate-payroll/', { month });

export const getPayroll = (month) =>
  httpClient.get('/payroll/', { params: { month } });

export const exportPayroll = (month) =>
  httpClient.get('/payroll/export/', { params: { month } });

