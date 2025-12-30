import React from 'react';

/**
 * Generic DataTable component for displaying tabular data
 * @param {Object} props
 * @param {Array} props.columns - Array of column configurations
 *   Each column: { key, label, render?: (value, row) => ReactNode }
 * @param {Array} props.data - Array of data rows
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.emptyMessage - Message when no data
 * @param {Array} props.actions - Array of action configurations
 *   Each action: { label, className, onClick: (row) => void }
 * @param {string} props.rowKey - Key to use for row identification (default: 'id')
 */
const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No data found.',
  actions = [],
  rowKey = 'id',
  wrapperClassName = '',
  wrapperStyle = {},
  noWrapper = false,
}) => {
  if (isLoading) {
    return <div className="management-empty">Loading…</div>;
  }

  if (!data || data.length === 0) {
    return <div className="management-empty">{emptyMessage}</div>;
  }

  const table = (
    <table className="management-table" style={{ width: '100%', tableLayout: 'auto' }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {actions.length > 0 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((column) => (
                <td key={`${row[rowKey]}-${column.key}`} data-label={column.label}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions.length > 0 && (
                <td data-label="Actions" className="actions">
                  {actions.map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={action.className || 'edit'}
                      onClick={() => action.onClick(row)}
                    >
                      {action.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
  );

  if (noWrapper) {
    return table;
  }

  return (
    <div className={`management-table-wrapper limited mobile-auto ${wrapperClassName}`.trim()} style={wrapperStyle}>
      {table}
    </div>
  );
};

export default DataTable;
