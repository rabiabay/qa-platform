// src/components/StatCard.tsx
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color }) => {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #eee',
      borderRadius: '10px',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{
        fontSize: '24px', fontWeight: 600,
        color: color || '#1a1a1a'
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '3px' }}>
          {sub}
        </div>
      )}
    </div>
  );
};

export default StatCard;