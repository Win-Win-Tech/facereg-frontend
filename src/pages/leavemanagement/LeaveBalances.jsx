import React, { useState, useEffect, useCallback } from 'react';
import { getLeaveBalances } from '../../api/leaveApi';
import { getEmployees } from '../../api/employeeApi';
import { getLocations } from '../../api/locationApi';
import useAuth from '../../hooks/useAuth';
import '../../styles/ManagementPages.css';

// Sub-components
import LeaveBalancesList from './LeaveBalancesList';

const LeaveBalances = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const { auth } = useAuth();
    const userLocationId = auth?.location_id || auth?.location;

    const [balances, setBalances] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

    // Tabs
    const [subTab, setSubTab] = useState('list');

    const loadData = useCallback(async () => {
        if (!filterLocation && isSuperAdmin) return;
        setLoading(true);
        try {
            const params = { year: filterYear };
            if (filterEmployee) params.employee_id = filterEmployee;
            if (filterLocation) params.location_id = filterLocation;

            const [balRes, empRes] = await Promise.all([
                getLeaveBalances(params),
                getEmployees(filterLocation ? { location_id: filterLocation } : {})
            ]);

            setBalances(Array.isArray(balRes.data) ? balRes.data : []);
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load balances');
        } finally {
            setLoading(false);
        }
    }, [filterEmployee, filterYear, filterLocation, isSuperAdmin, onNotify]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const columns = [
        { key: 'employee_name', label: 'Employee', render: (_, row) => row.employee_name || row.employee },
        { key: 'leave_type_name', label: 'Leave Type', render: (_, row) => row.leave_type_name || row.leave_type },
        { key: 'allocated_days', label: 'Allocated' },
        { key: 'used_days', label: 'Used' },
        { key: 'available_days', label: 'Available' },
        { key: 'year', label: 'Year' }
    ];

    return (
        <div className="tab-content-container">
            <div className="sub-tabs">
                <button
                    className={subTab === 'list' ? 'active' : ''}
                    onClick={() => setSubTab('list')}
                >
                    ⚖️ Balances
                </button>
            </div>

            {subTab === 'list' && (
                <LeaveBalancesList
                    balances={balances}
                    loading={loading}
                    columns={columns}
                    filterEmployee={filterEmployee}
                    setFilterEmployee={setFilterEmployee}
                    filterYear={filterYear}
                    setFilterYear={setFilterYear}
                    employees={employees}
                />
            )}
        </div>
    );
};

export default LeaveBalances;
