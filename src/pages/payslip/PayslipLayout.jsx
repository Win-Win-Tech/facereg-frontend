import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import GeneratePayslips from './generate/GeneratePayslips';
import PayslipRecords from './records/PayslipRecords';
import FieldConfigs from './configs/FieldConfigs';
import PayslipTemplates from './templates/PayslipTemplates';
import { getLocations } from '../../api/locationApi';
import useAuth from '../../hooks/useAuth';
import '../../styles/ManagementPages.css';

const PayslipLayout = ({ onNotify }) => {
    const { auth } = useAuth();
    const isSuperAdmin = auth?.role === 'superadmin';
    const userLocationId = auth?.location_id || auth?.location;

    const location = useLocation();
    const navigate = useNavigate();

    const [locations, setLocations] = useState([]);
    const [filterLocation, setFilterLocation] = useState(userLocationId || '');

    const loadLocations = useCallback(async () => {
        if (isSuperAdmin) {
            try {
                const locRes = await getLocations();
                const locs = Array.isArray(locRes.data) ? locRes.data : [];
                setLocations(locs);
                if (locs.length > 0 && !filterLocation) {
                    setFilterLocation(locs[0].id);
                }
            } catch (error) {
                onNotify?.('error', 'Error', 'Failed to load locations');
            }
        }
    }, [isSuperAdmin, filterLocation, onNotify]);

    useEffect(() => {
        loadLocations();
    }, [loadLocations]);

    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/payslip/generate')) return 'generate';
        if (path.includes('/payslip/records')) return 'records';
        if (path.includes('/payslip/configs')) return 'configs';
        if (path.includes('/payslip/templates')) return 'templates';
        return 'generate';
    };

    const activeTab = getActiveTab();

    const navigationItems = [
        { id: 'generate', label: 'Generate', icon: '⚡', path: '/payslip/generate' },
        { id: 'records', label: 'Records', icon: '📋', path: '/payslip/records' },
        { id: 'configs', label: 'Salary Setup', icon: '💰', path: '/payslip/configs' },
        { id: 'templates', label: 'Templates', icon: '🎨', path: '/payslip/templates' },
    ];

    return (
        <div className="management-page">
            <div className="management-header premium-header">
                <div className="header-left">
                    <h2 className="management-title">Payslip Management</h2>
                    <div className="header-location-filter">
                        {isSuperAdmin ? (
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                className="premium-select"
                            >
                                <option value="">Select Location</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        ) : (
                            <div className="location-chip premium-chip">
                                <span className="chip-icon">📍</span>
                                <span className="chip-text">{auth?.location_name || 'My Location'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="tab-container">
                <div className="tab-navigation premium-nav">
                    {navigationItems.map((item) => (
                        <button
                            key={item.id}
                            className={`tab-button ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="tab-icon">{item.icon}</span>
                            <span className="tab-label">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="tab-content-wrapper">
                    <Routes>
                        <Route 
                            path="/payslip/generate" 
                            element={
                                <GeneratePayslips 
                                    onNotify={onNotify} 
                                    filterLocation={filterLocation} 
                                    isSuperAdmin={isSuperAdmin} 
                                />
                            } 
                        />
                        <Route 
                            path="/payslip/records" 
                            element={
                                <PayslipRecords 
                                    onNotify={onNotify} 
                                    filterLocation={filterLocation} 
                                    isSuperAdmin={isSuperAdmin} 
                                />
                            } 
                        />
                        <Route 
                            path="/payslip/configs" 
                            element={
                                <FieldConfigs 
                                    onNotify={onNotify} 
                                    filterLocation={filterLocation} 
                                    isSuperAdmin={isSuperAdmin} 
                                />
                            } 
                        />
                        <Route 
                            path="/payslip/templates" 
                            element={
                                <PayslipTemplates 
                                    onNotify={onNotify} 
                                    filterLocation={filterLocation} 
                                    isSuperAdmin={isSuperAdmin} 
                                />
                            } 
                        />
                        <Route path="/payslip" element={<Navigate to="/payslip/generate" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default PayslipLayout;

