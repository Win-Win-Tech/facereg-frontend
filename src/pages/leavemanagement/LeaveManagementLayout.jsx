import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LeaveRequests from './LeaveRequests';
import LeaveBalances from './LeaveBalances';
import Holidays from './Holidays';
import Weekoffs from './Weekoffs';
import LeaveTypes from './LeaveTypes';
import ManualAttendance from './ManualAttendance';
import { getLocations } from '../../api/locationApi';
import useAuth from '../../hooks/useAuth';
import '../../styles/ManagementPages.css';

const LeaveManagementLayout = ({ onNotify }) => {
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
        if (path.includes('/leave-management/leave')) return 'leave';
        if (path.includes('/leave-management/balances')) return 'balances';
        if (path.includes('/leave-management/holidays')) return 'holidays';
        if (path.includes('/leave-management/weekoffs')) return 'weekoffs';
        if (path.includes('/leave-management/types')) return 'types';
        if (path.includes('/leave-management/manual-attendance')) return 'manual-attendance';
        return 'leave';
    };

    const activeTab = getActiveTab();

    const navigationItems = [
        { id: 'leave', label: 'Leave', icon: '📝', path: '/leave-management/leave' },
        { id: 'balances', label: 'Balances', icon: '⚖️', path: '/leave-management/balances' },
        { id: 'holidays', label: 'Holidays', icon: '🏖️', path: '/leave-management/holidays' },
        { id: 'weekoffs', label: 'Weekoffs', icon: '🗓️', path: '/leave-management/weekoffs' },
        { id: 'types', label: 'Settings', icon: '⚙️', path: '/leave-management/types' },
        { id: 'manual-attendance', label: 'Manual Attendance', icon: '✍️', path: '/leave-management/manual-attendance' },
    ];

    return (
        <div className="management-page">
            <div className="management-header premium-header">
                <div className="header-left">
                    <h2 className="management-title">Leave Management</h2>
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
                        <Route path="/leave-management/leave" element={<LeaveRequests onNotify={onNotify} filterLocation={filterLocation} isSuperAdmin={isSuperAdmin} />} />
                        <Route path="/leave-management/balances" element={<LeaveBalances onNotify={onNotify} filterLocation={filterLocation} isSuperAdmin={isSuperAdmin} />} />
                        <Route path="/leave-management/holidays" element={<Holidays onNotify={onNotify} filterLocation={filterLocation} isSuperAdmin={isSuperAdmin} />} />
                        <Route path="/leave-management/weekoffs" element={<Weekoffs onNotify={onNotify} filterLocation={filterLocation} isSuperAdmin={isSuperAdmin} />} />
                        <Route path="/leave-management/types" element={<LeaveTypes onNotify={onNotify} filterLocation={filterLocation} isSuperAdmin={isSuperAdmin} />} />
                        <Route path="/leave-management/manual-attendance" element={<ManualAttendance onNotify={onNotify} filterLocation={filterLocation} isSuperAdmin={isSuperAdmin} />} />
                        <Route path="/leave-management" element={<Navigate to="/leave-management/leave" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default LeaveManagementLayout;
