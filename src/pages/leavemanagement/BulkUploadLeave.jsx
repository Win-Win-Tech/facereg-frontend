import React, { useState } from 'react';

const BulkUploadLeave = ({ filterLocation, userLocationId, onNotify, onSuccess, submitting, setSubmitting, handleBulkUpload }) => {
    return (
        <div className="management-card">
            <div className="card-header">
                <h3>📤 Bulk Upload Leave Requests</h3>
            </div>
            <div className="bulk-upload-container" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                <div className="upload-instructions">
                    <p>Upload an Excel file with leave requests. Required columns:</p>
                    <div className="example-table-wrapper">
                        <table className="example-table">
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Leave Type ID</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>EMP001</td>
                                    <td>1</td>
                                    <td>2024-01-01</td>
                                    <td>2024-01-02</td>
                                    <td>Sick leave</td>
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

export default BulkUploadLeave;
