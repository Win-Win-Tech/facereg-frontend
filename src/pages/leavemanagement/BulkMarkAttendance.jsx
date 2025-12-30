import React, { useState } from 'react';

const BulkMarkAttendance = ({
    employees,
    submitting,
    handleBulkMark
}) => {
    const [bulkForm, setBulkForm] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        mark_all: false,
        employee_ids: []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        handleBulkMark(bulkForm);
    };

    return (
        <div className="management-card">
            <div className="card-header">
                <h3>📤 Bulk Mark Attendance</h3>
            </div>
            <form className="employee-form-container" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Start Date *</label>
                        <input
                            type="date"
                            value={bulkForm.start_date}
                            onChange={(e) => setBulkForm({ ...bulkForm, start_date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>End Date *</label>
                        <input
                            type="date"
                            value={bulkForm.end_date}
                            onChange={(e) => setBulkForm({ ...bulkForm, end_date: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Status *</label>
                    <select
                        value={bulkForm.status}
                        onChange={(e) => setBulkForm({ ...bulkForm, status: e.target.value })}
                    >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="HALF_DAY">Half Day</option>
                        <option value="HOLIDAY">Holiday</option>
                        <option value="WEEKOFF">Weekoff</option>
                        <option value="LEAVE">Leave</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="pattern-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            checked={bulkForm.mark_all}
                            onChange={(e) => setBulkForm({ ...bulkForm, mark_all: e.target.checked })}
                        />
                        Mark for all employees in location
                    </label>
                </div>
                {!bulkForm.mark_all && (
                    <div className="form-group">
                        <label>Select Employees</label>
                        <select
                            multiple
                            className="form-control"
                            style={{ height: '200px', width: '100%', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '0.5rem' }}
                            value={bulkForm.employee_ids}
                            onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                setBulkForm({ ...bulkForm, employee_ids: values });
                            }}
                        >
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                        <small style={{ color: '#64748b', marginTop: '0.5rem', display: 'block' }}>Hold Ctrl (or Cmd) to select multiple employees.</small>
                    </div>
                )}
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="primary-btn" disabled={submitting}>
                        {submitting ? 'Marking...' : 'Mark Bulk Attendance'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BulkMarkAttendance;
