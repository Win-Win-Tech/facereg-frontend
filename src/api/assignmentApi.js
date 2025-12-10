import httpClient from './httpClient';

export const getAssignments = (params) =>
  httpClient.get('/assignments/', { params });

export const createAssignment = (payload) =>
  httpClient.post('/assignments/', payload);

export const bulkCreateAssignments = (payload) =>
  httpClient.post('/assignments/bulk/', payload);

export const updateAssignment = (id, payload) =>
  httpClient.patch(`/assignments/${id}/`, payload);

export const deleteAssignment = (id) =>
  httpClient.delete(`/assignments/${id}/`);

export const getAssignmentDetail = (id) =>
  httpClient.get(`/assignments/${id}/`);
