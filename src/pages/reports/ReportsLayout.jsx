import React, { useState, useMemo } from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TodayReport from './TodayReport';
import MonthlyReport from './MonthlyReport';
import '../../styles/Reports.css';

const ReportsLayout = ({ onNotify }) => {
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/reports/monthly')) return 'monthly';
    if (path.includes('/reports/today')) return 'today';
    return 'today';
  };

  const activeTab = useMemo(() => getActiveTab(), [location.pathname]);

  return (
    <div className="reports-screen">
      <div className="reports-container">
        <div className="reports-tab-header">
          <Link 
            to="/reports/today" 
            className={`tab-button ${activeTab === 'today' ? 'active' : ''}`}
          >
            Today's
          </Link>
          <Link 
            to="/reports/monthly" 
            className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
          >
            Monthly
          </Link>
        </div>

        <div className="reports-tabs">
          <div className="reports-tab-panel">
            <Routes>
              <Route path="/reports/today" element={<TodayReport onNotify={onNotify} />} />
              <Route path="/reports/monthly" element={<MonthlyReport onNotify={onNotify} />} />
              <Route path="/reports" element={<Navigate to="/reports/today" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsLayout;
