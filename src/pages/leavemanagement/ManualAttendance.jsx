import React, { useState, useEffect, useCallback } from 'react';
import {
    getManualAttendance,
    createManualAttendance,
    bulkMarkManualAttendance,
    deleteManualAttendance
} from '../../api/leaveApi';
import { getEmployees } from '../../api/employeeApi';
import useAuth from '../../hooks/useAuth';
import '../../styles/ManagementPages.css';

// Sub-components
import ManualAttendanceList from './ManualAttendanceList';
import BulkMarkAttendance from './BulkMarkAttendance';
import MarkAttendanceForm from './MarkAttendanceForm';

const ManualAttendance = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const { auth } = useAuth();
    const userLocationId = auth?.location_id || auth?.location;

    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Filters
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // Tabs
    const [subTab, setSubTab] = useState('list');

    const loadData = useCallback(async () => {
        if (!filterLocation && isSuperAdmin) return;
        setLoading(true);
        try {
            const params = { date: filterDate, location_id: filterLocation };
            const [attRes, empRes] = await Promise.all([
                getManualAttendance(params),
                getEmployees({ location_id: filterLocation })
            ]);

            setAttendance(Array.isArray(attRes.data) ? attRes.data : []);
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load attendance');
        } finally {
            setLoading(false);
        }
    }, [filterDate, filterLocation, isSuperAdmin, onNotify]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleMarkSubmit = async (payload) => {
        setSubmitting(true);
        try {
            await createManualAttendance({
                ...payload,
                location_id: filterLocation || userLocationId
            });
            onNotify?.('success', 'Success', 'Attendance marked successfully');
            setSubTab('list');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to mark attendance');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkMark = async (bulkFormData) => {
        setSubmitting(true);
        try {
            await bulkMarkManualAttendance({
                ...bulkFormData,
                location_id: filterLocation || userLocationId
            });
            onNotify?.('success', 'Success', 'Attendance marked successfully');
            setSubTab('list');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to mark attendance');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await deleteManualAttendance(id);
            onNotify?.('success', 'Success', 'Entry deleted');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to delete entry');
        }
    };

    const columns = [
        { key: 'employee_name', label: 'Employee', render: (_, row) => row.employee_name || row.employee },
        { key: 'date', label: 'Date' },
        {
            key: 'status', label: 'Status', render: (val) => (
                <span className={`status-badge ${val.toLowerCase()}`}>{val}</span>
            )
        },
        { key: 'remarks', label: 'Remarks' }
    ];

    return (
        <div className="tab-content-container">
            <div className="sub-tabs">
                <button
                    className={subTab === 'list' ? 'active' : ''}
                    onClick={() => setSubTab('list')}
                >
                    📋 Attendance List
                </button>
                <button
                    className={subTab === 'mark' ? 'active' : ''}
                    onClick={() => setSubTab('mark')}
                >
                    ➕ Mark Attendance
                </button>
                <button
                    className={subTab === 'bulk' ? 'active' : ''}
                    onClick={() => setSubTab('bulk')}
                >
                    ✍️ Bulk Mark
                </button>
            </div>

            {subTab === 'list' && (
                <ManualAttendanceList
                    attendance={attendance}
                    loading={loading}
                    columns={columns}
                    filterDate={filterDate}
                    setFilterDate={setFilterDate}
                    handleDelete={handleDelete}
                />
            )}

            {subTab === 'mark' && (
                <MarkAttendanceForm
                    employees={employees}
                    onSubmit={handleMarkSubmit}
                    submitting={submitting}
                />
            )}

            {subTab === 'bulk' && (
                <BulkMarkAttendance
                    employees={employees}
                    submitting={submitting}
                    handleBulkMark={handleBulkMark}
                />
            )}
        </div>
    );
};

export default ManualAttendance;
