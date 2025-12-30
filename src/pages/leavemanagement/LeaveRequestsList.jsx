import React from 'react';
import DataTable from '../../components/DataTable';

const LeaveRequestsList = ({
    requests,
    loading,
    columns,
    actions,
    filterEmployee,
    setFilterEmployee,
    filterStatus,
    setFilterStatus,
    filterMonth,
    setFilterMonth,
    employees,
    isSuperAdmin,
    filterLocation,
    setFilterLocation,
    locations
}) => {
    return (
        <>
            <div className="management-actions">
                <div className="filters-group">
                    <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
                        <option value="">All Employees</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    />
                </div>
            </div>

            <div className="management-card">
                <DataTable
                    columns={columns}
                    data={requests}
                    isLoading={loading}
                    actions={actions}
                    rowKey="id"
                />
            </div>
        </>
    );
};

export default LeaveRequestsList;
