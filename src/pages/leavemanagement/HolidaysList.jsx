import React from 'react';
import DataTable from '../../components/DataTable';

const HolidaysList = ({
    holidays,
    loading,
    columns,
    actions,
    filterYear,
    setFilterYear,
    openCreateModal
}) => {
    return (
        <>
            <div className="management-actions">
                <div className="filters-group">
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
                    data={holidays}
                    isLoading={loading}
                    actions={actions}
                    rowKey="id"
                />
            </div>
        </>
    );
};

export default HolidaysList;
