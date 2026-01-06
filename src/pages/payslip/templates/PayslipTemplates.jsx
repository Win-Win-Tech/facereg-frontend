import React, { useState, useCallback, useRef } from 'react';
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../../api/payslipApi';
import httpClient from '../../../api/httpClient';
import { getLocations } from '../../../api/locationApi';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';
import useTabActive from '../../../hooks/useTabActive';
import "../../../styles/ManagementPages.css";

const PayslipTemplates = ({ onNotify, filterLocation, isSuperAdmin }) => {
    const [templates, setTemplates] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [subTab, setSubTab] = useState('list');

    // Preview Modal State
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Track if data has been loaded for this tab
    const hasLoadedRef = useRef(false);

    const [formData, setFormData] = useState({
        id: null,
        location_id: '',
        company_logo: null,
        company_logo_url: null,
        company_name: '',
        company_address: '',
        company_email: '',
        company_phone: '',
        company_gstin: '',
        // Defaults for hidden fields
        header_text: 'PAYSLIP',
        header_color: '#000000',
        header_alignment: 'center',
        footer_text: 'This is a system generated payslip.',
        footer_color: '#000000',
        page_size: 'A4',
        orientation: 'portrait',
        font_size: 10,
    });

    const [logoPreview, setLogoPreview] = useState(null);
    const fileInputRef = React.useRef(null);

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        const backendUrl = process.env.REACT_APP_API_BASE || 'http://localhost:8000';
        return `${backendUrl}${imagePath}`;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [templatesRes, locationsRes] = await Promise.all([
                listTemplates({ location_id: filterLocation }),
                getLocations()
            ]);

            const templatesData = Array.isArray(templatesRes.data) ? templatesRes.data : (templatesRes.data?.results || []);
            const locationsData = Array.isArray(locationsRes.data) ? locationsRes.data : (locationsRes.data?.results || []);

            setTemplates(templatesData);
            setLocations(locationsData);
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    }, [filterLocation, onNotify]);

    // Load data when tab becomes active
    useTabActive('templates', () => {
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadData();
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.location_id) {
            onNotify?.('error', 'Error', 'Please select a location');
            return;
        }

        setSubmitting(true);
        try {
            // Create FormData for file upload
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                // Skip internal fields that shouldn't be sent to backend
                if (key === 'company_logo') {
                    if (formData[key] instanceof File) {
                        data.append(key, formData[key]);
                    }
                } else if (key === 'company_logo_url' || key === 'id') {
                    // Skip these - id is used for URL, company_logo_url is for preview only
                    return;
                } else if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            if (formData.id && !formData.company_logo && !formData.company_logo_url) {
                data.append('company_logo', '');
            }

            if (formData.id) {
                await updateTemplate(formData.id, data);
                onNotify?.('success', 'Success', 'Template updated');
            } else {
                await createTemplate(data);
                onNotify?.('success', 'Success', 'Template created');
            }
            setSubTab('list');
            resetForm();
            loadData();
        } catch (error) {
            const msg = error.response?.data?.detail || 'Failed to save template';
            onNotify?.('error', 'Error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (template) => {
        if (!window.confirm('Delete this template? This cannot be undone.')) return;

        try {
            await deleteTemplate(template.id);
            onNotify?.('success', 'Success', 'Template deleted');
            loadData();
        } catch (error) {
            onNotify?.('error', 'Error', 'Failed to delete template');
        }
    };

    const handleView = async (template) => {
        try {
            setPreviewLoading(true);
            setShowPreviewModal(true);

            // Fetch the preview PDF
            const response = await httpClient.get(`/payslip-templates/${template.id}/preview/`, { responseType: 'blob' });

            // Create a blob URL
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            setPreviewPdfUrl(url);
        } catch (error) {
            console.error(error);
            onNotify?.('error', 'Error', 'Failed to generate preview');
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

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, company_logo: file, company_logo_url: null });
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setFormData({ ...formData, company_logo: null, company_logo_url: null });
        setLogoPreview(null);
        // Clear file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openEdit = (template) => {
        setFormData({
            id: template.id,
            // Ensure location_id is set correctly. If it's an object, get id. If it's string/int, use as is.
            location_id: template.location_id || (template.location ? template.location.id : '') || '',
            company_logo: null,
            company_logo_url: template.company_logo || null,
            company_name: template.company_name || '',
            company_address: template.company_address || '',
            company_email: template.company_email || '',
            company_phone: template.company_phone || '',
            company_gstin: template.company_gstin || '',
            // Keep existing values or defaults
            header_text: template.header_text || 'PAYSLIP',
            header_color: template.header_color || '#000000',
            header_alignment: template.header_alignment || 'center',
            footer_text: template.footer_text || 'This is a system generated payslip.',
            footer_color: template.footer_color || '#000000',
            page_size: template.page_size || 'A4',
            orientation: template.orientation || 'portrait',
            font_size: template.font_size || 10,
        });
        setLogoPreview(null);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setSubTab('add');
    };

    const resetForm = () => {
        setFormData({
            id: null,
            location_id: filterLocation || '',
            company_logo: null,
            company_logo_url: null,
            company_name: '',
            company_address: '',
            company_email: '',
            company_phone: '',
            company_gstin: '',
            header_text: 'PAYSLIP',
            header_color: '#000000',
            header_alignment: 'center',
            footer_text: 'This is a system generated payslip.',
            footer_color: '#000000',
            page_size: 'A4',
            orientation: 'portrait',
            font_size: 10,
        });
        setLogoPreview(null);
    };

    const columns = [
        { key: 'location_name', label: 'Location' },
        { key: 'company_name', label: 'Company Name', render: (val) => val || '—' },
        { key: 'company_email', label: 'Email', render: (val) => val || '—' },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="actions">
                    <button className="view" onClick={() => handleView(row)} title="View Logo/Details">👁️ View</button>
                    <button className="edit" onClick={() => openEdit(row)}>✏️ Edit</button>
                    <button className="delete" onClick={() => handleDelete(row)}>🗑️ Delete</button>
                </div>
            )
        }
    ];

    return (
        <div className="tab-content-container">
            <div className="sub-tabs">
                <button
                    className={subTab === 'list' ? 'active' : ''}
                    onClick={() => setSubTab('list')}
                >
                    🎨 Templates
                </button>
                <button
                    className={subTab === 'add' ? 'active' : ''}
                    onClick={() => {
                        resetForm();
                        setSubTab('add');
                    }}
                >
                    ➕ {formData.id ? 'Edit Template' : 'Add Template'}
                </button>
            </div>

            {subTab === 'list' && (
                <div className="management-card">
                    <div className="card-header">
                        <h3>Payslip Templates</h3>
                    </div>
                    <DataTable
                        columns={columns}
                        data={templates}
                        isLoading={loading}
                        rowKey="id"
                        wrapperStyle={{ 
                            maxHeight: 'calc(100vh - 350px)', 
                            overflowY: 'auto',
                            overflowX: 'auto',
                            width: '100%',
                            maxWidth: '100%'
                        }}
                    />
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && (
                <Modal
                    title="Template Preview"
                    onClose={closePreview}
                    fullScreen={true}
                >
                    <div className="pdf-preview-container fullscreen">
                        {previewLoading ? (
                            <div className="loading-spinner">Loading Preview...</div>
                        ) : (
                            <iframe
                                src={previewPdfUrl}
                                title="PDF Preview"
                                className="pdf-preview-frame"
                            />
                        )}
                    </div>
                </Modal>
            )}

            {subTab === 'add' && (
                <div className="management-card">
                    <div className="card-header">
                        <h3>{formData.id ? 'Edit' : 'Create'} Payslip Template</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="management-form">
                        <div className="form-section">
                            <h4 className="section-title">📍 Location</h4>
                            <label>
                                <span>Select Location <span className="required-indicator">*</span></span>
                                <select
                                    value={formData.location_id}
                                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                    className="form-control"
                                    required
                                    disabled={!!formData.id}
                                >
                                    <option value="">Select a location</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="form-section">
                            <h4 className="section-title">🏢 Company Information</h4>
                            <label>
                                <span>Company Logo</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="form-control"
                                />
                                <small style={{ color: '#64748b' }}>Upload a PNG or JPG image for the payslip header.</small>
                            </label>
                            
                            {(logoPreview || formData.company_logo_url) && (
                                <div style={{
                                    marginTop: '15px',
                                    padding: '10px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    backgroundColor: '#f8fafc',
                                    textAlign: 'center'
                                }}>
                                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Logo Preview:</p>
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="New Logo Preview"
                                            style={{
                                                maxWidth: '150px',
                                                maxHeight: '100px',
                                                objectFit: 'contain',
                                                marginBottom: '8px'
                                            }}
                                        />
                                    ) : formData.company_logo_url ? (
                                        <img
                                            src={getImageUrl(formData.company_logo_url)}
                                            alt="Current Logo"
                                            style={{
                                                maxWidth: '150px',
                                                maxHeight: '100px',
                                                objectFit: 'contain',
                                                marginBottom: '8px'
                                            }}
                                        />
                                    ) : null}
                                    <div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: '12px',
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Remove Logo
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <div className="management-form-two-column">
                                <label>
                                    <span>Company Name</span>
                                    <input
                                        type="text"
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        className="form-control"
                                        placeholder="Your Company Name"
                                    />
                                </label>
                                <label>
                                    <span>GSTIN</span>
                                    <input
                                        type="text"
                                        value={formData.company_gstin}
                                        onChange={(e) => setFormData({ ...formData, company_gstin: e.target.value })}
                                        className="form-control"
                                        placeholder="22AAAAA0000A1Z5"
                                    />
                                </label>
                            </div>
                            <label>
                                <span>Company Address</span>
                                <textarea
                                    value={formData.company_address}
                                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                                    className="form-control"
                                    rows={2}
                                    placeholder="Full company address"
                                />
                            </label>
                            <div className="management-form-two-column">
                                <label>
                                    <span>Email</span>
                                    <input
                                        type="email"
                                        value={formData.company_email}
                                        onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                                        className="form-control"
                                        placeholder="hr@company.com"
                                    />
                                </label>
                                <label>
                                    <span>Phone</span>
                                    <input
                                        type="text"
                                        value={formData.company_phone}
                                        onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                                        className="form-control"
                                        placeholder="+91 98765 43210"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Hidden fields for defaults */}
                        <input type="hidden" name="header_text" value={formData.header_text} />
                        <input type="hidden" name="header_color" value={formData.header_color} />
                        <input type="hidden" name="header_alignment" value={formData.header_alignment} />
                        <input type="hidden" name="footer_text" value={formData.footer_text} />
                        <input type="hidden" name="footer_color" value={formData.footer_color} />
                        <input type="hidden" name="page_size" value={formData.page_size} />
                        <input type="hidden" name="orientation" value={formData.orientation} />
                        <input type="hidden" name="font_size" value={formData.font_size} />

                        <div className="management-actions">
                            <button
                                type="button"
                                className="primary-btn secondary"
                                onClick={() => {
                                    setSubTab('list');
                                    resetForm();
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="primary-btn"
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : (formData.id ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PayslipTemplates;
