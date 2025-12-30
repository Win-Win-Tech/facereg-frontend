import React, { useState, useEffect } from 'react';
import { createLeaveRequest } from '../../api/leaveApi';

const ApplyLeaveTable = ({ employees, leaveTypes, onNotify, onSuccess, filterLocation, userLocationId, isSuperAdmin }) => {
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [rowStates, setRowStates] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Initialize row states when employees change
    useEffect(() => {
        const initialStates = {};
        employees.forEach(emp => {
            initialStates[emp.id] = {
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                leave_type_id: leaveTypes[0]?.id || '',
                reason: ''
            };
        });
        setRowStates(initialStates);
    }, [employees, leaveTypes]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedEmployees(employees.map(emp => emp.id));
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleInputChange = (id, field, value) => {
        setRowStates(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleApply = async () => {
        if (selectedEmployees.length === 0) {
            onNotify?.('warning', 'Warning', 'Please select at least one employee');
            return;
        }

        setSubmitting(true);
        try {
            const promises = selectedEmployees.map(id => {
                const rowData = rowStates[id];
                const payload = {
                    employee_id: id,
                    ...rowData,
                    location_id: filterLocation || userLocationId,
                    status: 'APPROVED'
                };
                return createLeaveRequest(payload);
            });

            await Promise.all(promises);
            onNotify?.('success', 'Success', `Leave applied for ${selectedEmployees.length} employees`);
            setSelectedEmployees([]);
            onSuccess?.();
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to apply leave for some employees';
            onNotify?.('error', 'Error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="management-card">
            <div className="card-header">
                <h3>➕ Apply Leave (Table View)</h3>
                <button
                    onClick={handleApply}
                    disabled={submitting || selectedEmployees.length === 0}
                    className="primary-btn"
                >
                    {submitting ? 'Applying...' : `Apply to Selected (${selectedEmployees.length})`}
                </button>
            </div>

            <div className="management-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={selectedEmployees.length === employees.length && employees.length > 0}
                                />
                            </th>
                            <th>Employee</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Leave Type</th>
                            <th>Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} className={selectedEmployees.includes(emp.id) ? 'selected-row' : ''}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployees.includes(emp.id)}
                                        onChange={() => handleSelectRow(emp.id)}
                                    />
                                </td>
                                <td>{emp.name}</td>
                                <td>
                                    <input
                                        type="date"
                                        value={rowStates[emp.id]?.start_date || ''}
                                        onChange={(e) => handleInputChange(emp.id, 'start_date', e.target.value)}
                                        className="table-input"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="date"
                                        value={rowStates[emp.id]?.end_date || ''}
                                        onChange={(e) => handleInputChange(emp.id, 'end_date', e.target.value)}
                                        className="table-input"
                                    />
                                </td>
                                <td>
                                    <select
                                        value={rowStates[emp.id]?.leave_type_id || ''}
                                        onChange={(e) => handleInputChange(emp.id, 'leave_type_id', e.target.value)}
                                        className="table-input"
                                    >
                                        <option value="">Select Type</option>
                                        {leaveTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.leave_type_name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={rowStates[emp.id]?.reason || ''}
                                        onChange={(e) => handleInputChange(emp.id, 'reason', e.target.value)}
                                        placeholder="Reason..."
                                        className="table-input"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ApplyLeaveTable;
