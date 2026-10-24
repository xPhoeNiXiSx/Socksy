/** La chaussette de Socksy, remplie de jaune et cerclée d'encre. */
export function Sock({ size = 54 }: { size?: number }) {
  return (
    <svg
      className="hero-sock"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#ffd23f"
      stroke="#111111"
      strokeWidth="1.4"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3h7v9l3.5 3.5a2.8 2.8 0 0 1-4 4L8.8 13.8A2.5 2.5 0 0 1 8 12V3z" />
      <path d="M8 6.5h7" fill="none" />
    </svg>
  );
}
