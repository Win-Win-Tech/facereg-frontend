import React, { useState } from 'react';

const WeekoffPatterns = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
    'ODD_SUNDAY', 'ODD_MONDAY', 'ODD_TUESDAY', 'ODD_WEDNESDAY', 'ODD_THURSDAY', 'ODD_FRIDAY', 'ODD_SATURDAY',
    'EVEN_SUNDAY', 'EVEN_MONDAY', 'EVEN_TUESDAY', 'EVEN_WEDNESDAY', 'EVEN_THURSDAY', 'EVEN_FRIDAY', 'EVEN_SATURDAY'
];

const SetWeekoffsTable = ({ employees, onSubmit, submitting }) => {
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedPatterns, setSelectedPatterns] = useState([]);

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

    const handlePatternToggle = (pattern) => {
        setSelectedPatterns(prev =>
            prev.includes(pattern) ? prev.filter(p => p !== pattern) : [...prev, pattern]
        );
    };

    const handleApply = () => {
        if (selectedEmployees.length === 0) return;
        if (selectedPatterns.length === 0) return;

        // The API expects one request per employee or a bulk endpoint if available.
        // Based on Weekoffs.jsx, it calls createOrUpdateEmployeeWeekoff(payload)
        // We'll pass the selected data back to the parent to handle the loop.
        onSubmit(selectedEmployees, selectedPatterns);
    };

    return (
        <div className="management-card">
            <div className="card-header">
                <h3>🗓️ Set Employee Weekoffs</h3>
                <button
                    onClick={handleApply}
                    disabled={submitting || selectedEmployees.length === 0 || selectedPatterns.length === 0}
                    className="primary-btn"
                >
                    {submitting ? 'Setting...' : `Apply to Selected (${selectedEmployees.length})`}
                </button>
            </div>

            <div className="form-group" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'block' }}>Select Weekoff Patterns</label>
                <div className="patterns-grid">
                    {WeekoffPatterns.map(pattern => (
                        <label key={pattern} className="pattern-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedPatterns.includes(pattern)}
                                onChange={() => handlePatternToggle(pattern)}
                            />
                            {pattern.replace(/_/g, ' ')}
                        </label>
                    ))}
                </div>
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
                            <th>Current Patterns</th>
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
                                <td>{emp.weekoff_patterns?.join(', ') || 'None'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SetWeekoffsTable;
