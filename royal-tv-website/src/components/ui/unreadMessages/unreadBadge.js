// 🔖 UnreadBadge.jsx
// Wrap children so the badge sits on top‑right.

const UnreadBadge = ({ value, children }) => (
  <div className="relative inline-block">
    {children /* main button or icon */}
    {value > 0 && (
      <span
        className="absolute -top-1 -right-1 min-w-[20px] px-1
                   text-xs text-white bg-red-600 rounded-full
                   flex items-center justify-center"
      >
        {value}
      </span>
    )}
  </div>
);

export default UnreadBadge;
