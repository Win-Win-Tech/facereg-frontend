import React from 'react';
import DataTable from '../../components/DataTable';

const ManualAttendanceList = ({
    attendance,
    loading,
    columns,
    handleDelete,
    filterDate,
    setFilterDate
}) => {
    return (
        <>
            <div className="management-actions">
                <div className="filters-group">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="management-card">
                <DataTable
                    columns={columns}
                    data={attendance}
                    isLoading={loading}
                    actions={[{ label: 'Delete', className: 'delete', onClick: (row) => handleDelete(row.id) }]}
                    rowKey="id"
                />
            </div>
        </>
    );
};

export default ManualAttendanceList;
