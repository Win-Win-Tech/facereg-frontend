import httpClient from './httpClient';

export const getEmployees = (params) =>
  httpClient.get('/employees/', { params });

export const registerEmployee = (formData) =>
  httpClient.post('/register/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateEmployee = (id, payload) => {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
  const config = isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined;
  return httpClient.patch(`/employees/${id}/`, payload, config);
};

export const deleteEmployee = (id) =>
  httpClient.delete(`/employees/${id}/`);

