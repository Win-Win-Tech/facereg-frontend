import React from 'react';
import DataTable from '../../components/DataTable';

const EmployeeWeekoffs = ({
    employeeWeekoffs,
    loading,
    columns,
    openEditModal,
    handleDeleteEmployeeWeekoff
}) => {
    return (
        <div className="management-card">
            <DataTable
                columns={columns}
                data={employeeWeekoffs}
                isLoading={loading}
                actions={[
                    { label: 'Edit', className: 'edit', onClick: openEditModal },
                    { label: 'Delete', className: 'delete', onClick: (row) => handleDeleteEmployeeWeekoff(row.id) }
                ]}
                rowKey="id"
            />
        </div>
    );
};

export default EmployeeWeekoffs;
