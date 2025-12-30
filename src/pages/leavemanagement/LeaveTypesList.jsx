import React from 'react';
import DataTable from '../../components/DataTable';

const LeaveTypesList = ({
    leaveTypes,
    loading,
    columns,
    actions,
    openCreateModal
}) => {
    return (
        <div className="management-card">
            <DataTable
                columns={columns}
                data={leaveTypes}
                isLoading={loading}
                actions={actions}
                rowKey="id"
            />
        </div>
    );
};

export default LeaveTypesList;
