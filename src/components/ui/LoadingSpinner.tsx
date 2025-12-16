'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  message?: string;
}

export default function LoadingSpinner({ size = 'md', text, message }: LoadingSpinnerProps) {
  const displayText = text || message;
  const sizeMap = {
    sm: '24px',
    md: '40px',
    lg: '60px',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        gap: '16px',
      }}
    >
      <div
        className="spinner"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
        }}
      />
      {displayText && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          {displayText}
        </p>
      )}
    </div>
  );
}
