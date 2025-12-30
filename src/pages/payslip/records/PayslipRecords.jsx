import React, { useState, useEffect, useCallback } from 'react';
import { listPayslips, downloadPayslipPDF, approvePayslip, deletePayslip } from '../../../api/payslipApi';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';
import httpClient from '../../../api/httpClient';
import "../../../styles/ManagementPages.css";

const PayslipRecords = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [downloadingId, setDownloadingId] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    
    // Preview Modal State
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const loadPayslips = useCallback(async () => {
        setLoading(true);
        try {
            const params = { month: selectedMonth };
            if (filterLocation) {
                params.location_id = filterLocation;
            }
            const response = await listPayslips(params);
            setPayslips(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load payslips');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, filterLocation, onNotify]);

    useEffect(() => {
        loadPayslips();
    }, [loadPayslips]);

    const handleDownload = async (payslip) => {
        setDownloadingId(payslip.id);
        try {
            const response = await downloadPayslipPDF(payslip.id);

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslip-${payslip.month}-${payslip.employee_name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            onNotify?.('success', 'Success', 'Payslip downloaded');
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to download payslip');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleApprove = async (payslip) => {
        if (payslip.status === 'APPROVED') return;

        setApprovingId(payslip.id);
        try {
            await approvePayslip(payslip.id);
            onNotify?.('success', 'Success', 'Payslip approved');
            loadPayslips();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to approve payslip');
        } finally {
            setApprovingId(null);
        }
    };

    const handleDelete = async (payslip) => {
        if (!window.confirm('Are you sure you want to delete this payslip?')) return;

        try {
            await deletePayslip(payslip.id);
            onNotify?.('success', 'Success', 'Payslip deleted');
            loadPayslips();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to delete payslip');
        }
    };

    const handleView = async (payslip) => {
        try {
            setPreviewLoading(true);
            setShowPreviewModal(true);

            // Fetch the payslip PDF
            const response = await downloadPayslipPDF(payslip.id);

            // Create a blob URL
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            setPreviewPdfUrl(url);
        } catch (error) {
            console.error(error);
            onNotify?.('error', 'Error', 'Failed to load payslip');
            setShowPreviewModal(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        setShowPreviewModal(false);
        if (previewPdfUrl) {
            window.URL.revokeObjectURL(previewPdfUrl);
            setPreviewPdfUrl(null);
        }
    };

    const filteredPayslips = payslips.filter(p =>
        p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const columns = [
        { key: 'employee_name', label: 'Employee' },
        { key: 'month', label: 'Month' },
        { key: 'working_days', label: 'Working Days' },
        { key: 'present_days', label: 'Present' },
        {
            key: 'gross_salary',
            label: 'Gross Salary',
            render: (val) => formatCurrency(val)
        },
        {
            key: 'total_deductions',
            label: 'Deductions',
            render: (val) => formatCurrency(val)
        },
        {
            key: 'net_pay',
            label: 'Net Pay',
            render: (val) => formatCurrency(val)
        },
        {
            key: 'status',
            label: 'Status',
            render: (val) => (
                <span className={`status-badge ${val?.toLowerCase()}`}>
                    {val === 'DRAFT' && '📝'}
                    {val === 'APPROVED' && '✅'}
                    {val === 'PAID' && '💵'}
                    {val}
                </span>
            )
        },
        {
            key: 'generated_on',
            label: 'Generated',
            render: (val) => formatDate(val)
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="actions">
                    <button
                        className="view"
                        onClick={() => handleView(row)}
                        title="View PDF"
                        style={{ marginRight: '5px' }}
                    >
                        👁️ 
                    </button>
                    <button
                        className="edit"
                        onClick={() => handleDownload(row)}
                        disabled={downloadingId === row.id}
                        title="Download PDF"
                    >
                        {downloadingId === row.id ? '...' : '⬇️'}
                    </button>
                    {row.status === 'DRAFT' && (
                        <button
                            className="assign"
                            onClick={() => handleApprove(row)}
                            disabled={approvingId === row.id}
                            title="Approve"
                        >
                            {approvingId === row.id ? '...' : '✓'}
                        </button>
                    )}
                    <button
                        className="delete"
                        onClick={() => handleDelete(row)}
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="tab-content-container" style={{ width: '95%', maxWidth: '95%', overflow: 'hidden' }}>
            <div className="management-card" style={{ width: '100%', maxWidth: '100%' }}>
                <div className="card-header">
                    <h3>Payslip Records</h3>
                    <div className="management-actions">
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="form-control"
                            style={{ width: '180px' }}
                        />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-control"
                            style={{ width: '200px' }}
                        />
                        <button
                            className="primary-btn secondary"
                            onClick={loadPayslips}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={filteredPayslips}
                    isLoading={loading}
                    rowKey="id"
                    wrapperStyle={{ 
                        maxHeight: 'calc(100vh - 150px)', 
                        overflowY: 'auto',
                        overflowX: 'auto',
                        width: '100%',
                        maxWidth: '100%'
                    }}
                />
            </div>

            {/* Preview Modal */}
            {showPreviewModal && (
                <Modal
                    title="Payslip Preview"
                    onClose={closePreview}
                    fullScreen={true}
                >
                    <div className="pdf-preview-container fullscreen">
                        {previewLoading ? (
                            <div className="loading-spinner">Loading Payslip...</div>
                        ) : (
                            <iframe
                                src={previewPdfUrl}
                                title="Payslip Preview"
                                className="pdf-preview-frame"
                            />
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default PayslipRecords;
