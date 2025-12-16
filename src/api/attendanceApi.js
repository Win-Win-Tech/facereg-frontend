import httpClient from './httpClient';

export const markAttendance = (formData) =>
  httpClient.post('/attendance/', formData);

export const getTodayAttendanceSummary = (params) =>
  httpClient.get('/attendance-summary/', { params });

export const exportTodayAttendanceSummary = (params, config = {}) =>
  httpClient.get('/attendance-summary/export/', { params, ...config });

export const getMonthlyAttendanceStatus = (params) =>
  httpClient.get('/monthly-attendance-status/', { params });

export const exportMonthlyAttendanceStatus = (params, config = {}) =>
  httpClient.get('/monthly-attendance/export/', { params, ...config });

