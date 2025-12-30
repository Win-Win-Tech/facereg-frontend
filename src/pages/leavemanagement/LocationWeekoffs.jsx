import React from 'react';
import DataTable from '../../components/DataTable';

const LocationWeekoffs = ({
    locationWeekoffs,
    loading,
    columns,
    openEditModal
}) => {
    return (
        <div className="management-card">
            <DataTable
                columns={columns}
                data={locationWeekoffs}
                isLoading={loading}
                actions={[{ label: 'Edit', className: 'edit', onClick: openEditModal }]}
                rowKey="id"
            />
        </div>
    );
};

export default LocationWeekoffs;
