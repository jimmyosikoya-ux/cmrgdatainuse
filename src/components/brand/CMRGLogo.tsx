import React from 'react';

interface CMRGLogoProps {
  className?: string;
  variant?: 'official' | 'compact' | 'monogram' | 'svg';
  inverted?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CMRGLogo: React.FC<CMRGLogoProps> = ({
  className = '',
  variant = 'official',
  inverted = false,
  size = 'md',
}) => {
  const textColor = inverted ? '#FFFFFF' : '#111111';
  const subtextColor = inverted ? '#94a3b8' : '#111111';
  const squareColor = '#D71920';

  // Exact vector SVG rendition directly matching images.png
  // "RC378525" above "Ltd."
  // "CMRG Ltd." in bold black
  // 14 red squares on row 1, 14 red squares on row 2 shifted right by 1 square width
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.4 : 1.0;
  const width = Math.round(220 * scale);
  const height = Math.round(62 * scale);

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 240 68"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* RC Registration Number right-aligned over Ltd. */}
        <text
          x="215"
          y="11"
          textAnchor="end"
          fill={subtextColor}
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="13"
          letterSpacing="0.5px"
        >
          RC378525
        </text>

        {/* Wordmark: CMRG Ltd. */}
        <text
          x="2"
          y="36"
          fill={textColor}
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="36"
          letterSpacing="-0.5px"
        >
          CMRG Ltd.
        </text>

        {/* 14 Red Square Blocks - Row 1 */}
        {Array.from({ length: 14 }).map((_, i) => (
          <rect
            key={`sq1-${i}`}
            x={6 + i * 14.5}
            y={44}
            width={10.5}
            height={10.5}
            rx={0.5}
            fill={squareColor}
          />
        ))}

        {/* 14 Red Square Blocks - Row 2 (Staggered/indented by 1 square to the right) */}
        {Array.from({ length: 14 }).map((_, i) => (
          <rect
            key={`sq2-${i}`}
            x={6 + 14.5 + i * 14.5}
            y={57}
            width={10.5}
            height={10.5}
            rx={0.5}
            fill={squareColor}
          />
        ))}
      </svg>
    </div>
  );
};
