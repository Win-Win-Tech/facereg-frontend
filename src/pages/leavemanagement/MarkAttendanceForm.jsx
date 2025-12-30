import React, { useState, useEffect } from 'react';

const MarkAttendanceForm = ({ employees, onSubmit, submitting }) => {
    const [form, setForm] = useState({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        remarks: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.employee_id) return;
        onSubmit(form);
    };

    return (
        <div className="management-card">
            <div className="card-header">
                <h3>✍️ Mark Manual Attendance</h3>
            </div>
            <form className="employee-form-container" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Employee *</label>
                    <select
                        value={form.employee_id}
                        onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                        required
                    >
                        <option value="">Select Employee</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Date *</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Status *</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            required
                        >
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                            <option value="HALF_DAY">Half Day</option>
                            <option value="HOLIDAY">Holiday</option>
                            <option value="WEEKOFF">Weekoff</option>
                            <option value="LEAVE">Leave</option>
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label>Remarks</label>
                    <textarea
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                        placeholder="Optional remarks..."
                        rows="3"
                    />
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="primary-btn" disabled={submitting || !form.employee_id}>
                        {submitting ? 'Marking...' : 'Mark Attendance'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MarkAttendanceForm;
