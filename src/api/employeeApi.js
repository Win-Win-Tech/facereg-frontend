import httpClient from './httpClient';

export const getEmployees = (params) =>
  httpClient.get('/employees/', { params });

export const getEmployeeById = (id) =>
  httpClient.get(`/employees/${id}/`);

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

// Shift and Site APIs - Support multiple endpoint variations
export const getShifts = (params) => {
  // Handle both string (locationId) and object (params) for backward compatibility
  const queryParams = typeof params === 'string' 
    ? (params ? { location_id: params } : {})
    : (params || {});
  // Try multiple possible endpoints
  return httpClient.get('/shifts/', { params: queryParams })
    .catch(() => {
      // Fallback: try createshift endpoint
      return httpClient.get('/createshift/shifts/', { params: queryParams })
        .catch(() => {
          // Return empty array if both fail
          return Promise.resolve({ data: [] });
        });
    });
};

export const getSites = (params) => {
  // Handle both string (locationId) and object (params) for backward compatibility
  const queryParams = typeof params === 'string' 
    ? (params ? { location_id: params } : {})
    : (params || {});
  return httpClient.get('/sites/', { params: queryParams })
    .catch(() => {
      // Fallback: try alternative endpoint
      return httpClient.get('/createshift/sites/', { params: queryParams })
        .catch(() => {
          return Promise.resolve({ data: [] });
        });
    });
};

// Assignment APIs
export const getAssignments = (params) =>
  httpClient.get('/assignments/', { params })
    .catch(() => {
      // Return empty array if endpoint not found
      return Promise.resolve({ data: [] });
    });

export const createAssignment = (payload) =>
  httpClient.post('/assignments/', payload);

export const updateAssignment = (id, payload) =>
  httpClient.patch(`/assignments/${id}/`, payload);

export const deleteAssignment = (id) =>
  httpClient.delete(`/assignments/${id}/`);

// User Site APIs
export const getUserSites = (userId) =>
  httpClient.get(`/users/${userId}/sites/`)
    .catch(() => {
      return Promise.resolve({ data: [] });
    });

export const assignUserSites = (userId, payload) =>
  httpClient.post(`/users/${userId}/sites/`, payload);

