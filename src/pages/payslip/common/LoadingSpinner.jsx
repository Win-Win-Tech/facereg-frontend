import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
    return (
        <div className="payslip-loading">
            <div className="loading-spinner"></div>
            <span className="loading-text">{text}</span>
        </div>
    );
};

export default LoadingSpinner;

