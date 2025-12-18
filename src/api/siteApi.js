import httpClient from './httpClient';

export const getSites = (params) =>
  httpClient.get('/sites/', { params });

export const createSite = (payload) =>
  httpClient.post('/sites/', payload);

export const updateSite = (id, payload) =>
  httpClient.patch(`/sites/${id}/`, payload);

export const deleteSite = (id) =>
  httpClient.delete(`/sites/${id}/`);

export const getSiteDetail = (id) =>
  httpClient.get(`/sites/${id}/`);

export const assignShiftsToSite = (siteId, payload) =>
  httpClient.post(`/sites/${siteId}/bulk-shifts/`, payload);
