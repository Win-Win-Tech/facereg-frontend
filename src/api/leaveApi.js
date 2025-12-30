import httpClient from './httpClient';

// LeaveType APIs
export const getLeaveTypes = (params) => httpClient.get('/leave-types/', { params });
export const createLeaveType = (data) => httpClient.post('/leave-types/', data);
export const getLeaveType = (id) => httpClient.get(`/leave-types/${id}/`);
export const updateLeaveType = (id, data) => httpClient.patch(`/leave-types/${id}/`, data);
export const deleteLeaveType = (id) => httpClient.delete(`/leave-types/${id}/`);

// Holiday APIs
export const getHolidays = (params) => httpClient.get('/holidays/', { params });
export const createHoliday = (data) => httpClient.post('/holidays/', data);
export const bulkCreateHolidays = (data) => httpClient.post('/holidays/bulk/', data);
export const bulkCreateHolidaysGrouped = (data) => httpClient.post('/holidays/bulk/grouped-dates/', data);
export const uploadHolidaysExcel = (formData) => httpClient.post('/holidays/bulk/excel-upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getHoliday = (id) => httpClient.get(`/holidays/${id}/`);
export const updateHoliday = (id, data) => httpClient.patch(`/holidays/${id}/`, data);
export const deleteHoliday = (id) => httpClient.delete(`/holidays/${id}/`);

// Location Weekoff APIs
export const getLocationWeekoffs = (params) => httpClient.get('/weekoffs/location/', { params });
export const createOrUpdateLocationWeekoff = (data) => httpClient.post('/weekoffs/location/', data);
export const updateLocationWeekoff = (id, data) => httpClient.patch(`/weekoffs/location/${id}/`, data);
export const deleteLocationWeekoff = (id) => httpClient.delete(`/weekoffs/location/${id}/`);

// Employee Weekoff APIs
export const getEmployeeWeekoffs = (params) => httpClient.get('/weekoffs/employee/', { params });
export const createOrUpdateEmployeeWeekoff = (data) => httpClient.post('/weekoffs/employee/', data);
export const updateEmployeeWeekoff = (id, data) => httpClient.patch(`/weekoffs/employee/${id}/`, data);
export const deleteEmployeeWeekoff = (id) => httpClient.delete(`/weekoffs/employee/${id}/`);

// LeaveRequest APIs
export const getLeaveRequests = (params) => httpClient.get('/leave-requests/', { params });
export const createLeaveRequest = (data) => httpClient.post('/leave-requests/', data);
export const bulkCreateLeaveRequests = (data) => httpClient.post('/leave-requests/bulk/', data);
export const getLeaveRequest = (id) => httpClient.get(`/leave-requests/${id}/`);
export const updateLeaveRequest = (id, data) => httpClient.patch(`/leave-requests/${id}/`, data);
export const deleteLeaveRequest = (id) => httpClient.delete(`/leave-requests/${id}/`);
export const approveLeaveRequest = (id) => httpClient.post(`/leave-requests/${id}/approve/`);
export const rejectLeaveRequest = (id, data) => httpClient.post(`/leave-requests/${id}/reject/`, data);

// LeaveBalance APIs
export const getLeaveBalances = (params) => httpClient.get('/leave-balances/', { params });
export const createLeaveBalance = (data) => httpClient.post('/leave-balances/', data);
export const getLeaveBalance = (id) => httpClient.get(`/leave-balances/${id}/`);
export const updateLeaveBalance = (id, data) => httpClient.patch(`/leave-balances/${id}/`, data);
export const deleteLeaveBalance = (id) => httpClient.delete(`/leave-balances/${id}/`);

// Manual Attendance APIs
export const getManualAttendance = (params) => httpClient.get('/manual-attendance/', { params });
export const createManualAttendance = (data) => httpClient.post('/manual-attendance/', data);
export const bulkCreateManualAttendance = (data) => httpClient.post('/manual-attendance/bulk/', data);
export const bulkUpdateManualAttendance = (data) => httpClient.patch('/manual-attendance/bulk/update/', data);
export const bulkDeleteManualAttendance = (data) => httpClient.post('/manual-attendance/bulk/delete/', data);
export const bulkMarkManualAttendance = (data) => httpClient.post('/manual-attendance/bulk/mark/', data);
export const getManualAttendanceDetail = (id) => httpClient.get(`/manual-attendance/${id}/`);
export const updateManualAttendance = (id, data) => httpClient.patch(`/manual-attendance/${id}/`, data);
export const deleteManualAttendance = (id) => httpClient.delete(`/manual-attendance/${id}/`);
