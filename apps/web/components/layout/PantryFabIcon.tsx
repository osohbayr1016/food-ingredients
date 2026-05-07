/** Fridge / pantry — “what’s at home”, not a generic add (+) action */
export function PantryFabIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      className="text-white"
      aria-hidden
    >
      <path
        d="M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path d="M5 11h14" stroke="currentColor" strokeWidth="1.65" />
      <circle cx="17" cy="16" r="1.25" fill="currentColor" />
      <path
        d="M11 6.5c0 1.1.9 2 2 2h2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
