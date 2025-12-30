import React from 'react';

const StatsCard = ({ icon, value, label, color = 'green' }) => {
    return (
        <div className="payslip-stat-card">
            <div className={`stat-icon-wrapper ${color}`}>
                <span>{icon}</span>
            </div>
            <div className="stat-content">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
};

export const StatsGrid = ({ stats }) => {
    return (
        <div className="payslip-stats-grid">
            {stats.map((stat, idx) => (
                <StatsCard key={idx} {...stat} />
            ))}
        </div>
    );
};

export default StatsCard;

