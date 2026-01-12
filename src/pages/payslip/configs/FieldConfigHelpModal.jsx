import React from 'react';

const FieldConfigHelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    maxWidth: '900px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '2px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#ffffff',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: '600' }}>
                        📚 Field Configuration Help
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f1f5f9';
                            e.target.style.color = '#1e293b';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#64748b';
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Value Types Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ 
                            color: '#0c4a6e', 
                            marginBottom: '1rem', 
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            borderBottom: '2px solid #0ea5e9',
                            paddingBottom: '0.5rem'
                        }}>
                            💼 Value Types
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: '0.5rem'
                            }}>
                                <strong style={{ color: '#0c4a6e', display: 'block', marginBottom: '0.5rem' }}>
                                    Percentage of Gross
                                </strong>
                                <p style={{ margin: 0, color: '#475569', fontSize: '0.875rem' }}>
                                    Enter a number (e.g., 40) which represents a percentage of the employee's gross salary.
                                    Example: <code style={{ backgroundColor: '#e0f2fe', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>40</code> means 40% of gross salary.
                                </p>
                            </div>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: '0.5rem'
                            }}>
                                <strong style={{ color: '#0c4a6e', display: 'block', marginBottom: '0.5rem' }}>
                                    Fixed Amount
                                </strong>
                                <p style={{ margin: 0, color: '#475569', fontSize: '0.875rem' }}>
                                    Enter a fixed numeric value that will be used as-is.
                                    Example: <code style={{ backgroundColor: '#e0f2fe', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>5000</code> means ₹5,000 (or your currency).
                                </p>
                            </div>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#fef3c7',
                                border: '1px solid #fcd34d',
                                borderRadius: '0.5rem'
                            }}>
                                <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.5rem' }}>
                                    Custom Calculation
                                </strong>
                                <p style={{ margin: 0, color: '#78350f', fontSize: '0.875rem' }}>
                                    Enter a formula using available variables and mathematical operations.
                                    Example: <code style={{ backgroundColor: '#fde68a', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>absent_days * deduction_per_day</code>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Available Variables Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ 
                            color: '#0c4a6e', 
                            marginBottom: '1rem', 
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            borderBottom: '2px solid #0ea5e9',
                            paddingBottom: '0.5rem'
                        }}>
                            📝 Available Variables for Calculations
                        </h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                            gap: '0.75rem',
                            padding: '1rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '0.5rem'
                        }}>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>gross_salary</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Employee's gross salary</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>base_salary</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Employee's base salary</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>present_days</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Present days (can be decimal like 28.5)</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #fee2e2'
                            }}>
                                <code style={{ backgroundColor: '#fee2e2', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>absent_days</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Absent days (can be decimal like 1.5)</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>paid_leave_days</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Paid leave days</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #fee2e2'
                            }}>
                                <code style={{ backgroundColor: '#fee2e2', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>unpaid_leave_days</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Unpaid leave days</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>working_days</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total working days</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>total_days</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total calendar days</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #fee2e2'
                            }}>
                                <code style={{ backgroundColor: '#fee2e2', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>deduction_per_day</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Auto: gross_salary / working_days</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>holiday_count</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Number of holidays</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>weekoff_count</code>
                                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Number of weekoffs</span>
                            </div>
                        </div>
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            color: '#475569',
                            fontStyle: 'italic'
                        }}>
                            <strong>Note:</strong> You can also use any previously calculated field code (e.g., <code style={{ backgroundColor: '#e2e8f0', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>BASIC</code>, <code style={{ backgroundColor: '#e2e8f0', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>HRA</code>) in your formulas.
                        </div>
                    </div>

                    {/* Formula Examples Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ 
                            color: '#0c4a6e', 
                            marginBottom: '1rem', 
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            borderBottom: '2px solid #0ea5e9',
                            paddingBottom: '0.5rem'
                        }}>
                            💡 Common Formula Examples
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '0.5rem'
                            }}>
                                <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.75rem', fontSize: '1rem' }}>
                                    For Deductions:
                                </strong>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#991b1b', fontSize: '0.875rem', lineHeight: '1.8' }}>
                                    <li>
                                        <code style={{ backgroundColor: '#fee2e2', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: '600' }}>absent_days * deduction_per_day</code>
                                        <br />
                                        <span style={{ fontSize: '0.75rem', color: '#7f1d1d', fontStyle: 'italic' }}>Deduct for absent days</span>
                                    </li>
                                    <li>
                                        <code style={{ backgroundColor: '#fee2e2', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: '600' }}>unpaid_leave_days * deduction_per_day</code>
                                        <br />
                                        <span style={{ fontSize: '0.75rem', color: '#7f1d1d', fontStyle: 'italic' }}>Deduct for unpaid leaves</span>
                                    </li>
                                    <li>
                                        <code style={{ backgroundColor: '#fee2e2', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: '600' }}>(absent_days + unpaid_leave_days) * deduction_per_day</code>
                                        <br />
                                        <span style={{ fontSize: '0.75rem', color: '#7f1d1d', fontStyle: 'italic' }}>Deduct for both absent and unpaid leave days</span>
                                    </li>
                                    <li>
                                        <code style={{ backgroundColor: '#fee2e2', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: '600' }}>gross_salary * 0.12</code>
                                        <br />
                                        <span style={{ fontSize: '0.75rem', color: '#7f1d1d', fontStyle: 'italic' }}>12% deduction from gross</span>
                                    </li>
                                </ul>
                            </div>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '0.5rem'
                            }}>
                                <strong style={{ color: '#16a34a', display: 'block', marginBottom: '0.75rem', fontSize: '1rem' }}>
                                    For Earnings:
                                </strong>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534', fontSize: '0.875rem', lineHeight: '1.8' }}>
                                    <li>
                                        <code style={{ backgroundColor: '#dcfce7', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: '600' }}>BASIC * 0.40</code>
                                        <br />
                                        <span style={{ fontSize: '0.75rem', color: '#14532d', fontStyle: 'italic' }}>40% of Basic salary</span>
                                    </li>
                                    <li>
                                        <code style={{ backgroundColor: '#dcfce7', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: '600' }}>gross_salary * 0.50</code>
                                        <br />
                                        <span style={{ fontSize: '0.75rem', color: '#14532d', fontStyle: 'italic' }}>50% of Gross salary</span>
                                    </li>
                                    <li>
                                        <code style={{ backgroundColor: '#dcfce7', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: '600' }}>present_days * (gross_salary / working_days)</code>
                                        <br />
                                        <span style={{ fontSize: '0.75rem', color: '#14532d', fontStyle: 'italic' }}>Pro-rated salary based on present days</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Quick Templates Section */}
                    <div>
                        <h3 style={{ 
                            color: '#0c4a6e', 
                            marginBottom: '1rem', 
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            borderBottom: '2px solid #0ea5e9',
                            paddingBottom: '0.5rem'
                        }}>
                            ⚡ Quick Templates for Deductions
                        </h3>
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fcd34d',
                            borderRadius: '0.5rem'
                        }}>
                            <p style={{ margin: '0 0 0.75rem 0', color: '#78350f', fontSize: '0.875rem' }}>
                                When creating a <strong>Deduction</strong> field with <strong>Custom Calculation</strong> value type, you can use these common formulas:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #fde68a'
                                }}>
                                    <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>
                                        Absent Days Deduction:
                                    </strong>
                                    <code style={{ backgroundColor: '#fef3c7', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                        absent_days * deduction_per_day
                                    </code>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#78350f', fontStyle: 'italic' }}>
                                        Calculates deduction based on number of absent days. The system automatically calculates <code style={{ backgroundColor: '#fde68a', padding: '0.125rem 0.25rem', borderRadius: '0.125rem' }}>deduction_per_day</code> as gross_salary / working_days.
                                    </p>
                                </div>
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #fde68a'
                                }}>
                                    <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>
                                        Unpaid Leave Deduction:
                                    </strong>
                                    <code style={{ backgroundColor: '#fef3c7', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                        unpaid_leave_days * deduction_per_day
                                    </code>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#78350f', fontStyle: 'italic' }}>
                                        Calculates deduction for unpaid leave days.
                                    </p>
                                </div>
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #fde68a'
                                }}>
                                    <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.25rem' }}>
                                        Combined Absent + Unpaid Leave:
                                    </strong>
                                    <code style={{ backgroundColor: '#fef3c7', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                        (absent_days + unpaid_leave_days) * deduction_per_day
                                    </code>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#78350f', fontStyle: 'italic' }}>
                                        Calculates deduction for both absent days and unpaid leave days combined.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '2px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    backgroundColor: '#f8fafc'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: '#0ea5e9',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#0284c7';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#0ea5e9';
                        }}
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FieldConfigHelpModal;
