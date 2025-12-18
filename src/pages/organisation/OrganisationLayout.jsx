import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import LocationsPage from './LocationsPage';
import SitesPage from './SitesPage';
import ShiftsPage from './ShiftsPage';
import BulkAssignmentPage from './BulkAssignmentPage';
import '../../styles/ManagementPages.css';

const OrganisationLayout = ({ onNotify }) => {
  const location = useLocation();

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/organisation/locations')) return 'locations';
    if (path.includes('/organisation/sites')) return 'sites';
    if (path.includes('/organisation/shifts')) return 'shifts';
    if (path.includes('/organisation/bulk-assignment')) return 'bulk-assignment';
    return 'locations';
  };

  const activeTab = getActiveTab();

  const navigationItems = [
    { id: 'locations', label: 'Locations', path: '/organisation/locations' },
    { id: 'sites', label: 'Sites', path: '/organisation/sites' },
    { id: 'shifts', label: 'Shifts', path: '/organisation/shifts' },
    { id: 'bulk-assignment', label: 'Bulk Assignment', path: '/organisation/bulk-assignment' },
  ];

  return (
    <div className="management-page">
      <div className="management-header">
        <h2 className="management-title">Organisation Setup</h2>
      </div>

      <div className="tab-container">
        <div className="tab-navigation">
          {navigationItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`tab-button ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Routes>
          <Route path="/organisation/locations" element={<LocationsPage onNotify={onNotify} />} />
          <Route path="/organisation/sites" element={<SitesPage onNotify={onNotify} />} />
          <Route path="/organisation/shifts" element={<ShiftsPage onNotify={onNotify} />} />
          <Route path="/organisation/bulk-assignment" element={<BulkAssignmentPage onNotify={onNotify} />} />
          <Route path="/organisation" element={<Navigate to="/organisation/locations" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default OrganisationLayout;
