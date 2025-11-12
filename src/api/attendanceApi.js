import httpClient from './httpClient';

export const markAttendance = (formData) =>
  httpClient.post('/attendance/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getTodayAttendanceSummary = () =>
  httpClient.get('/attendance-summary/');

export const exportTodayAttendanceSummary = () =>
  httpClient.get('/attendance-summary/export/');

export const getMonthlyAttendanceStatus = (params) =>
  httpClient.get('/monthly-attendance-status/', { params });

export const exportMonthlyAttendanceStatus = (params) =>
  httpClient.get('/monthly-attendance/export/', { params });

