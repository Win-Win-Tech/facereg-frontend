import httpClient from './httpClient';

export const getLocations = (params) =>
  httpClient.get('/locations/', { params });

export const createLocation = (payload) =>
  httpClient.post('/locations/', payload);

export const updateLocation = (id, payload) =>
  httpClient.patch(`/locations/${id}/`, payload);

export const deleteLocation = (id) =>
  httpClient.delete(`/locations/${id}/`);

