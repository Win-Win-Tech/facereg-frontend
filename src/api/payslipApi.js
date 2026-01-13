import httpClient from './httpClient';

export const listPayslips = (params) => httpClient.get('/payslips/', { params });

export const generatePayslip = (payload) => httpClient.post('/payslips/generate/', payload);

export const getPayslip = (id, config = {}) =>
  httpClient.get(`/payslips/${id}/`, { responseType: 'blob', ...config });

export const downloadPayslipPDF = (id, config = {}) =>
  httpClient.get(`/payslips/${id}/download/`, { responseType: 'blob', ...config });

export const payslipReports = (params) => httpClient.get('/payslips/reports/', { params });

export const deletePayslip = (id) => httpClient.delete(`/payslips/${id}/`);

export default {
  listPayslips,
  generatePayslip,
  getPayslip,
  payslipReports,
  deletePayslip,
};

/**
 * Get all payslip field configurations
 * @param {Object} params - Query parameters (e.g., { location_id: 'uuid' })
 */
export const getPayslipConfigs = (params = {}) => {
  return httpClient.get('/payslip-field-configs/', { params });
};

/**
 * Get a specific payslip field configuration by ID
 */
export const getPayslipConfigById = async (id) => {
  try {
    const response = await httpClient.get(`/payslip-field-configs/${id}/`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createPayslipConfig = (payload) => httpClient.post('/payslip-field-configs/', payload);

export const updatePayslipConfig = (id, payload) => httpClient.patch(`/payslip-field-configs/${id}/`, payload);

export const deletePayslipConfig = (id) => httpClient.delete(`/payslip-field-configs/${id}/`);

// Payslip fields
export const listFields = (configId) => httpClient.get(`/payslip-field-configs/${configId}/fields/`);
export const createField = (configId, payload) =>
  httpClient.post(`/payslip-field-configs/${configId}/fields/`, payload);
export const updateField = (configId, fieldId, payload) =>
  httpClient.patch(`/payslip-field-configs/${configId}/fields/${fieldId}/`, payload);
export const deleteField = (configId, fieldId) =>
  httpClient.delete(`/payslip-field-configs/${configId}/fields/${fieldId}/`);

// Payslip layout templates
export const listTemplates = (params) => httpClient.get('/payslip-templates/', { params });
export const createTemplate = (payload) => httpClient.post('/payslip-templates/', payload);
export const updateTemplate = (id, payload) => httpClient.patch(`/payslip-templates/${id}/`, payload);
export const deleteTemplate = (id) => httpClient.delete(`/payslip-templates/${id}/`);

// Payslip approval
export const approvePayslip = (id) => httpClient.post(`/payslips/${id}/approve/`);