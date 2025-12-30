import React from 'react';

const EmptyState = ({ 
    icon = '📭', 
    title = 'No Data', 
    description = 'No items to display',
    action,
    actionText
}) => {
    return (
        <div className="payslip-empty-state">
            <span className="empty-icon">{icon}</span>
            <h4 className="empty-title">{title}</h4>
            <p className="empty-description">{description}</p>
            {action && actionText && (
                <button 
                    className="payslip-btn payslip-btn-primary"
                    onClick={action}
                >
                    {actionText}
                </button>
            )}
        </div>
    );
};

export default EmptyState;

