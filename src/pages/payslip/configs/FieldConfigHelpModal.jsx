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
                    maxWidth: '1000px',
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
                        📚 Payslip Field Configuration - Complete Guide
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
                    {/* Overview Section */}
                    <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
                        <h3 style={{ color: '#1e40af', marginBottom: '0.75rem', fontSize: '1.125rem', fontWeight: '600' }}>
                            📖 Overview
                        </h3>
                        <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.875rem', lineHeight: '1.6' }}>
                            The payslip system allows you to create custom salary configurations with flexible calculations. 
                            You can define earnings, deductions, and information fields using percentages, fixed amounts, or custom formulas.
                            <strong> Earnings always show full amounts</strong>, while deductions can be calculated on full or pro-rated (earned) amounts.
                        </p>
                    </div>

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
                                <strong style={{ color: '#0c4a6e', display: 'block', marginBottom: '0.5rem', fontSize: '1rem' }}>
                                    Percentage of Gross
                                </strong>
                                <p style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem' }}>
                                    Enter a number (e.g., 40) which represents a percentage of the employee's <strong>full gross salary</strong>.
                                </p>
                                <div style={{ backgroundColor: '#e0f2fe', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                                    <strong>Example:</strong> <code style={{ backgroundColor: '#bae6fd', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>40</code> means 40% of gross salary
                                    <br />
                                    <strong>Use Case:</strong> Basic Salary (60%), HRA (20%), ESI (0.75%)
                                </div>
                            </div>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: '0.5rem'
                            }}>
                                <strong style={{ color: '#0c4a6e', display: 'block', marginBottom: '0.5rem', fontSize: '1rem' }}>
                                    Fixed Amount
                                </strong>
                                <p style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.875rem' }}>
                                    Enter a fixed numeric value that will be used as-is (not pro-rated).
                                </p>
                                <div style={{ backgroundColor: '#e0f2fe', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                                    <strong>Example:</strong> <code style={{ backgroundColor: '#bae6fd', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>5000</code> means ₹5,000
                                    <br />
                                    <strong>Use Case:</strong> Transport Allowance (₹2,000), Medical Allowance (₹1,500), Professional Tax (₹200)
                                </div>
                            </div>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#fef3c7',
                                border: '1px solid #fcd34d',
                                borderRadius: '0.5rem'
                            }}>
                                <strong style={{ color: '#92400e', display: 'block', marginBottom: '0.5rem', fontSize: '1rem' }}>
                                    Custom Calculation (Formula)
                                </strong>
                                <p style={{ margin: '0 0 0.5rem 0', color: '#78350f', fontSize: '0.875rem' }}>
                                    Enter a formula using available variables, mathematical operations, and special keywords for pro-rated calculations.
                                </p>
                                <div style={{ backgroundColor: '#fde68a', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                                    <strong>Examples:</strong>
                                    <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                                        <li><code style={{ backgroundColor: '#fbbf24', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>BASIC * 0.12</code> - 12% of Basic (full)</li>
                                        <li><code style={{ backgroundColor: '#fbbf24', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>BASIC_EARNED * 0.12</code> - 12% of Basic (pro-rated)</li>
                                        <li><code style={{ backgroundColor: '#fbbf24', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>absent_days * deduction_per_day</code> - Loss of Pay</li>
                                    </ul>
                                </div>
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
                            📝 All Available Variables
                        </h3>
                        
                        {/* System Variables */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#0369a1', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                                System Variables (Always Available)
                            </h4>
                        <div style={{ 
                            display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
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
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Full monthly gross salary (not pro-rated)</span>
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
                                    border: '1px solid #dcfce7'
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
                                    border: '1px solid #dcfce7'
                            }}>
                                <code style={{ backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>paid_leave_days</code>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Paid leave days (approved)</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #fee2e2'
                            }}>
                                <code style={{ backgroundColor: '#fee2e2', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>unpaid_leave_days</code>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Unpaid leave days (approved)</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>working_days</code>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total working days (excludes holidays/weekoffs)</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>total_days</code>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total calendar days in month</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #fee2e2'
                            }}>
                                <code style={{ backgroundColor: '#fee2e2', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>deduction_per_day</code>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Auto-calculated: gross_salary / working_days</span>
                                </div>
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>net_payable_days</code>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Days for which employee should be paid (present + paid_leave)</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>holiday_count</code>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Number of holidays in month</span>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#ffffff',
                                borderRadius: '0.375rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <code style={{ backgroundColor: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>weekoff_count</code>
                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Number of weekoffs in month</span>
                                </div>
                            </div>
                        </div>

                        {/* Pro-Rated Keywords */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#0369a1', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                                Pro-Rated Calculation Keywords (Use in Formulas)
                            </h4>
                            <div style={{ 
                                padding: '1rem',
                                backgroundColor: '#fef3c7',
                                borderRadius: '0.5rem',
                                border: '1px solid #fcd34d'
                            }}>
                                <p style={{ margin: '0 0 0.75rem 0', color: '#78350f', fontSize: '0.875rem' }}>
                                    <strong>Use these keywords in Custom Calculation formulas to calculate on pro-rated (earned) amounts instead of full amounts.</strong>
                                </p>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #fde68a'
                                    }}>
                                        <code style={{ backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>BASIC_EARNED</code>
                                        <span style={{ fontSize: '0.875rem', color: '#78350f' }}>Pro-rated Basic Salary = BASIC × (present_days / working_days)</span>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#92400e', fontStyle: 'italic' }}>
                                            <strong>Example:</strong> If BASIC = ₹18,000, present_days = 2, working_days = 30<br />
                                            BASIC_EARNED = ₹18,000 × (2/30) = ₹1,200
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #fde68a'
                                    }}>
                                        <code style={{ backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>GROSS_EARNED</code>
                                        <span style={{ fontSize: '0.875rem', color: '#78350f' }}>Pro-rated Gross Salary = gross_salary × (present_days / working_days)</span>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#92400e', fontStyle: 'italic' }}>
                                            <strong>Example:</strong> If gross_salary = ₹30,000, present_days = 2, working_days = 30<br />
                                            GROSS_EARNED = ₹30,000 × (2/30) = ₹2,000
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #fde68a'
                                    }}>
                                        <code style={{ backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>BASIC_FULL</code>
                                        <span style={{ fontSize: '0.875rem', color: '#78350f' }}>Full Basic Salary (same as BASIC) - for clarity in formulas</span>
                        </div>
                        <div style={{
                            padding: '0.75rem',
                                        backgroundColor: '#ffffff',
                            borderRadius: '0.375rem',
                                        border: '1px solid #fde68a'
                                    }}>
                                        <code style={{ backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>GROSS_FULL</code>
                                        <span style={{ fontSize: '0.875rem', color: '#78350f' }}>Full Gross Salary (same as gross_salary) - for clarity in formulas</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calculated Field Variables */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#0369a1', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                                Calculated Field Variables (Available After Calculation)
                            </h4>
                            <div style={{ 
                                padding: '1rem',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '0.5rem',
                                border: '1px solid #bbf7d0'
                        }}>
                                <p style={{ margin: '0 0 0.75rem 0', color: '#166534', fontSize: '0.875rem' }}>
                                    <strong>You can reference any previously calculated field by its field_code.</strong> Fields are calculated in display_order, so later fields can reference earlier ones.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                                    <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '0.375rem' }}>
                                        <code style={{ backgroundColor: '#dcfce7', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontWeight: '600' }}>BASIC</code>
                                    </div>
                                    <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '0.375rem' }}>
                                        <code style={{ backgroundColor: '#dcfce7', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontWeight: '600' }}>HRA</code>
                                    </div>
                                    <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '0.375rem' }}>
                                        <code style={{ backgroundColor: '#dcfce7', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontWeight: '600' }}>PF</code>
                                    </div>
                                    <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '0.375rem' }}>
                                        <code style={{ backgroundColor: '#dcfce7', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontWeight: '600' }}>ESI</code>
                                    </div>
                                    <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '0.375rem' }}>
                                        <code style={{ backgroundColor: '#dcfce7', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontWeight: '600' }}>TRANSPORT</code>
                                    </div>
                                    <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '0.375rem' }}>
                                        <code style={{ backgroundColor: '#dcfce7', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontWeight: '600' }}>LOP</code>
                                    </div>
                                </div>
                                <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#14532d', fontStyle: 'italic' }}>
                                    <strong>Example:</strong> If you have a field with field_code "BASIC", you can use <code style={{ backgroundColor: '#bbf7d0', padding: '0.125rem 0.25rem', borderRadius: '0.125rem' }}>BASIC * 0.12</code> in another field's formula to calculate 12% of Basic.
                                </p>
                            </div>
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
                            💡 Complete Formula Examples
                        </h3>
                        
                        {/* Earnings Examples */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#16a34a', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                                Earnings Examples
                            </h4>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#166534', display: 'block', marginBottom: '0.25rem' }}>Basic Salary (60% of Gross)</strong>
                                            <code style={{ backgroundColor: '#dcfce7', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                                Value Type: Percentage | Value: 60
                                            </code>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#14532d', fontStyle: 'italic' }}>
                                        Shows 60% of full gross salary. Earnings always display full amounts.
                                    </p>
                                </div>
                            <div style={{
                                padding: '1rem',
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                borderRadius: '0.5rem'
                            }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#166534', display: 'block', marginBottom: '0.25rem' }}>HRA (40% of Basic)</strong>
                                            <code style={{ backgroundColor: '#dcfce7', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                                Value Type: Calculation | Value: BASIC * 0.40
                                            </code>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#14532d', fontStyle: 'italic' }}>
                                        Calculates 40% of Basic Salary. BASIC must be calculated before this field (set lower display_order).
                                    </p>
                            </div>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '0.5rem'
                            }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#166534', display: 'block', marginBottom: '0.25rem' }}>Transport Allowance (Fixed)</strong>
                                            <code style={{ backgroundColor: '#dcfce7', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                                Value Type: Fixed | Value: 2000
                                            </code>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#14532d', fontStyle: 'italic' }}>
                                        Fixed ₹2,000 per month (not pro-rated).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Deductions Examples */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#dc2626', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                                Deductions Examples
                            </h4>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.25rem' }}>PF on Full Basic (Standard)</strong>
                                            <code style={{ backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                                Value Type: Calculation | Value: BASIC * 0.12
                                            </code>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#991b1b', fontStyle: 'italic' }}>
                                        12% of full Basic Salary. Use when you want PF calculated on full amount regardless of attendance.
                                    </p>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.25rem' }}>PF on Pro-Rated Basic (Earned Wages) ⭐ Recommended</strong>
                                            <code style={{ backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                                Value Type: Calculation | Value: BASIC_EARNED * 0.12
                                            </code>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#991b1b', fontStyle: 'italic' }}>
                                        12% of pro-rated Basic Salary. <strong>Prevents PF from exceeding earned amount.</strong> Legally compliant.
                                    </p>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.25rem' }}>ESI on Full Gross (Standard)</strong>
                                            <code style={{ backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                                Value Type: Percentage | Value: 0.75
                                            </code>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#991b1b', fontStyle: 'italic' }}>
                                        0.75% of full Gross Salary. Use when you want ESI calculated on full amount.
                                    </p>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.25rem' }}>ESI on Pro-Rated Gross (Earned Wages) ⭐ Recommended</strong>
                                            <code style={{ backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                                Value Type: Calculation | Value: GROSS_EARNED * 0.0075
                                            </code>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#991b1b', fontStyle: 'italic' }}>
                                        0.75% of pro-rated Gross Salary. <strong>Prevents ESI from exceeding earned amount.</strong> Legally compliant.
                                    </p>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.25rem' }}>Loss of Pay (LOP)</strong>
                                            <code style={{ backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                                Value Type: Calculation | Value: absent_days * deduction_per_day
                                            </code>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#991b1b', fontStyle: 'italic' }}>
                                        Deducts salary for absent days. If not configured, system auto-calculates as "LOP" field.
                                    </p>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.25rem' }}>TDS (Tax Deducted at Source)</strong>
                                            <code style={{ backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>
                                                Value Type: Calculation | Value: (gross_salary - PF - ESI) * 0.10
                                            </code>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#991b1b', fontStyle: 'italic' }}>
                                        10% TDS on (Gross - PF - ESI). PF and ESI must be calculated before this field.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pro-Rated vs Full Comparison */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ 
                            color: '#0c4a6e', 
                            marginBottom: '1rem', 
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            borderBottom: '2px solid #0ea5e9',
                            paddingBottom: '0.5rem'
                        }}>
                            ⚖️ Full vs Pro-Rated Calculation Comparison
                        </h3>
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '0.5rem',
                            border: '1px solid #e2e8f0'
                        }}>
                            <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.875rem' }}>
                                <strong>Example Scenario:</strong> Employee with ₹30,000 gross, ₹18,000 Basic, 2 present days, 28 absent days, 30 working days
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #fecaca'
                                }}>
                                    <strong style={{ color: '#dc2626', display: 'block', marginBottom: '0.75rem' }}>Full Amount Calculation</strong>
                                    <div style={{ fontSize: '0.875rem', color: '#991b1b', lineHeight: '1.8' }}>
                                        <div><strong>PF:</strong> BASIC * 0.12 = ₹18,000 × 0.12 = <strong>₹2,160</strong></div>
                                        <div><strong>ESI:</strong> gross_salary * 0.0075 = ₹30,000 × 0.0075 = <strong>₹225</strong></div>
                                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem' }}>
                                            <strong>Issue:</strong> PF+ESI = ₹2,385 {'>'} Earned (₹2,000) ❌
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #bbf7d0'
                                }}>
                                    <strong style={{ color: '#16a34a', display: 'block', marginBottom: '0.75rem' }}>Pro-Rated Calculation ⭐</strong>
                                    <div style={{ fontSize: '0.875rem', color: '#166534', lineHeight: '1.8' }}>
                                        <div><strong>PF:</strong> BASIC_EARNED * 0.12 = ₹1,200 × 0.12 = <strong>₹144</strong></div>
                                        <div><strong>ESI:</strong> GROSS_EARNED * 0.0075 = ₹2,000 × 0.0075 = <strong>₹15</strong></div>
                                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#dcfce7', borderRadius: '0.25rem' }}>
                                            <strong>Result:</strong> PF+ESI = ₹159 {'<'} Earned (₹2,000) ✅
                                        </div>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ 
                            color: '#0c4a6e', 
                            marginBottom: '1rem', 
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            borderBottom: '2px solid #0ea5e9',
                            paddingBottom: '0.5rem'
                        }}>
                            ⚠️ Important Notes
                        </h3>
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#fef3c7',
                            borderRadius: '0.5rem',
                            border: '1px solid #fcd34d'
                        }}>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#78350f', fontSize: '0.875rem', lineHeight: '1.8' }}>
                                <li><strong>Earnings always show full amounts</strong> - They are never pro-rated in the payslip display</li>
                                <li><strong>Field Order Matters</strong> - Fields are calculated in display_order. Reference fields must be calculated first</li>
                                <li><strong>When present_days = 0</strong> - All deductions (except LOP) are skipped. LOP = full gross_salary</li>
                                <li><strong>Pro-rated keywords</strong> (BASIC_EARNED, GROSS_EARNED) are calculated automatically when used in formulas</li>
                                <li><strong>Case-insensitive</strong> - Variable names are case-insensitive (BASIC = basic = Basic)</li>
                                <li><strong>Mathematical operations</strong> - Use +, -, *, /, and parentheses () in formulas</li>
                                <li><strong>Field codes must be unique</strong> - Each field_code must be unique within a configuration</li>
                            </ul>
                        </div>
                    </div>

                    {/* Quick Reference */}
                    <div>
                        <h3 style={{ 
                            color: '#0c4a6e', 
                            marginBottom: '1rem', 
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            borderBottom: '2px solid #0ea5e9',
                            paddingBottom: '0.5rem'
                        }}>
                            📋 Quick Reference Table
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: '600' }}>Field Type</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: '600' }}>Value Type</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: '600' }}>Example Value</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: '600' }}>Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Earning</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Percentage</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}><code>60</code></td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>60% of full gross</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Earning</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Fixed</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}><code>2000</code></td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>₹2,000 (full amount)</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Deduction</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Percentage</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}><code>0.75</code></td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>0.75% of full gross</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Deduction</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Calculation</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}><code>BASIC * 0.12</code></td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>12% of full Basic</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Deduction</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Calculation</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}><code>BASIC_EARNED * 0.12</code></td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>12% of pro-rated Basic ⭐</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Deduction</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Calculation</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}><code>GROSS_EARNED * 0.0075</code></td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>0.75% of pro-rated Gross ⭐</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Deduction</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Calculation</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}><code>absent_days * deduction_per_day</code></td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Loss of Pay (LOP)</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Info</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Fixed</td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}><code>present_days</code></td>
                                        <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>Shows present_days value</td>
                                    </tr>
                                </tbody>
                            </table>
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
