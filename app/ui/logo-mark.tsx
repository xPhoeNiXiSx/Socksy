/** Le logo Socksy : la chaussette jaune sur un autocollant tomate. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="7" y="7" width="52" height="52" rx="14" fill="#111111" />
      <rect x="4" y="4" width="52" height="52" rx="14" fill="#FF5A36" stroke="#111111" strokeWidth="2.5" />
      <g transform="translate(12 10) scale(1.5) rotate(-8 12 12)">
        <path
          d="M8 3h7v9l3.5 3.5a2.8 2.8 0 0 1-4 4L8.8 13.8A2.5 2.5 0 0 1 8 12V3z"
          fill="#FFD23F"
          stroke="#111111"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 6.5h7" stroke="#111111" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
