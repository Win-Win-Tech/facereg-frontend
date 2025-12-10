import httpClient from './httpClient';

export const getShifts = (params) =>
  httpClient.get('/shifts/', { params });

export const createShift = (payload) =>
  httpClient.post('/shifts/', payload);

export const updateShift = (id, payload) =>
  httpClient.patch(`/shifts/${id}/`, payload);

export const deleteShift = (id) =>
  httpClient.delete(`/shifts/${id}/`);

export const getShiftDetail = (id) =>
  httpClient.get(`/shifts/${id}/`);
