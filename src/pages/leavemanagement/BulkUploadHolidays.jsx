import React from 'react';

const BulkUploadHolidays = ({ submitting, handleBulkUpload }) => {
    return (
        <div className="management-card">
            <div className="card-header">
                <h3>📤 Bulk Upload Holidays</h3>
            </div>
            <div className="bulk-upload-container" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                <div className="upload-instructions">
                    <p>Upload an Excel file with holidays. Required columns:</p>
                    <div className="example-table-wrapper">
                        <table className="example-table">
                            <thead>
                                <tr>
                                    <th>holiday_date</th>
                                    <th>holiday_name</th>
                                    <th>holiday_type</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>2024-01-01</td>
                                    <td>New Year</td>
                                    <td>NATIONAL</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="upload-field">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleBulkUpload}
                        disabled={submitting}
                    />
                    {submitting && <p className="uploading-text">Uploading...</p>}
                </div>
            </div>
        </div>
    );
};

export default BulkUploadHolidays;
