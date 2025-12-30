import React from 'react';
import DataTable from '../../components/DataTable';

const LeaveBalancesList = ({
    balances,
    loading,
    columns,
    filterEmployee,
    setFilterEmployee,
    filterYear,
    setFilterYear,
    employees
}) => {
    return (
        <>
            <div className="management-actions">
                <div className="filters-group">
                    <span className="filter-icon">🔍</span>
                    <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
                        <option value="">All Employees</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                    <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                        {[2023, 2024, 2025, 2026].map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="management-card">
                <DataTable
                    columns={columns}
                    data={balances}
                    isLoading={loading}
                    rowKey="id"
                />
            </div>
        </>
    );
};

export default LeaveBalancesList;
