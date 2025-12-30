import React, { useState, useEffect, useCallback } from 'react';
import {
    getLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    getLeaveTypes
} from '../../api/leaveApi';
import { getEmployees } from '../../api/employeeApi';
import { getLocations } from '../../api/locationApi';
import useAuth from '../../hooks/useAuth';
import '../../styles/ManagementPages.css';

// Sub-components
import LeaveRequestsList from './LeaveRequestsList';
import ApplyLeaveTable from './ApplyLeaveTable';
import BulkUploadLeave from './BulkUploadLeave';

const LeaveRequests = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const { auth } = useAuth();
    const userLocationId = auth?.location_id || auth?.location;

    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    // Tabs
    const [subTab, setSubTab] = useState('requests');
    const [submitting, setSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        if (!filterLocation && isSuperAdmin) return;
        setLoading(true);
        try {
            const params = {};
            if (filterEmployee) params.employee_id = filterEmployee;
            if (filterStatus) params.status = filterStatus;
            if (filterMonth) params.month = filterMonth;
            if (filterLocation) params.location_id = filterLocation;

            const [reqRes, empRes, typeRes] = await Promise.all([
                getLeaveRequests(params),
                getEmployees(filterLocation ? { location_id: filterLocation } : {}),
                getLeaveTypes(filterLocation ? { location_id: filterLocation } : {})
            ]);

            setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
            setLeaveTypes(Array.isArray(typeRes.data) ? typeRes.data : []);
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [filterEmployee, filterStatus, filterMonth, filterLocation, isSuperAdmin, onNotify]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('excel_file', file);
        if (filterLocation || userLocationId) {
            formData.append('location_id', filterLocation || userLocationId);
        }

        setSubmitting(true);
        try {
            onNotify?.('info', 'Info', 'Bulk upload for leave requests is being processed');
            // await uploadLeaveRequestsExcel(formData); 
            setSubTab('requests');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to upload leave requests');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await approveLeaveRequest(id);
            onNotify?.('success', 'Success', 'Leave request approved');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to approve leave');
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Enter rejection reason:');
        if (reason === null) return;
        try {
            await rejectLeaveRequest(id, { rejection_reason: reason });
            onNotify?.('success', 'Success', 'Leave request rejected');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to reject leave');
        }
    };

    const columns = [
        { key: 'employee_name', label: 'Employee', render: (_, row) => row.employee_name || row.employee },
        { key: 'leave_type_name', label: 'Type', render: (_, row) => row.leave_type_name || row.leave_type },
        { key: 'start_date', label: 'Start Date' },
        { key: 'end_date', label: 'End Date' },
        { key: 'total_days', label: 'Days' },
        {
            key: 'status', label: 'Status', render: (val) => (
                <span className={`status-badge ${val.toLowerCase()}`}>{val}</span>
            )
        },
        { key: 'reason', label: 'Reason' }
    ];

    const actions = [
        {
            label: 'Approve',
            className: 'approve-btn',
            show: (row) => row.status === 'PENDING',
            onClick: (row) => handleApprove(row.id)
        },
        {
            label: 'Reject',
            className: 'reject-btn',
            show: (row) => row.status === 'PENDING',
            onClick: (row) => handleReject(row.id)
        }
    ];

    return (
        <div className="tab-content-container">
            <div className="sub-tabs">
                <button
                    className={subTab === 'requests' ? 'active' : ''}
                    onClick={() => setSubTab('requests')}
                >
                    📋 Requests
                </button>
                <button
                    className={subTab === 'apply' ? 'active' : ''}
                    onClick={() => setSubTab('apply')}
                >
                    ➕ Apply Leave
                </button>
                <button
                    className={subTab === 'bulk' ? 'active' : ''}
                    onClick={() => setSubTab('bulk')}
                >
                    📤 Bulk Upload
                </button>
            </div>

            {subTab === 'requests' && (
                <LeaveRequestsList
                    requests={requests}
                    loading={loading}
                    columns={columns}
                    actions={actions}
                    filterEmployee={filterEmployee}
                    setFilterEmployee={setFilterEmployee}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    filterMonth={filterMonth}
                    setFilterMonth={setFilterMonth}
                    employees={employees}
                />
            )}

            {subTab === 'apply' && (
                <ApplyLeaveTable
                    employees={employees}
                    leaveTypes={leaveTypes}
                    onNotify={onNotify}
                    onSuccess={() => {
                        setSubTab('requests');
                        loadData();
                    }}
                    filterLocation={filterLocation}
                    userLocationId={userLocationId}
                    isSuperAdmin={isSuperAdmin}
                />
            )}

            {subTab === 'bulk' && (
                <BulkUploadLeave
                    filterLocation={filterLocation}
                    userLocationId={userLocationId}
                    onNotify={onNotify}
                    onSuccess={() => {
                        setSubTab('requests');
                        loadData();
                    }}
                    submitting={submitting}
                    setSubmitting={setSubmitting}
                    handleBulkUpload={handleBulkUpload}
                />
            )}
        </div>
    );
};

export default LeaveRequests;
