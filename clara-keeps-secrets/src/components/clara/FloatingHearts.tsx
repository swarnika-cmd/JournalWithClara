const HEARTS = [
  { top: "8%", left: "6%", size: 22, color: "#d4838f", delay: 0 },
  { top: "14%", left: "88%", size: 16, color: "#c41e3a", delay: 1.2 },
  { top: "24%", left: "18%", size: 12, color: "#f4c2c2", delay: 2.4 },
  { top: "32%", left: "76%", size: 20, color: "#d4838f", delay: 0.6 },
  { top: "48%", left: "4%", size: 14, color: "#8b2252", delay: 1.8 },
  { top: "58%", left: "92%", size: 18, color: "#d4838f", delay: 0.3 },
  { top: "68%", left: "12%", size: 24, color: "#c41e3a", delay: 2.1 },
  { top: "74%", left: "82%", size: 12, color: "#f4c2c2", delay: 1.5 },
  { top: "84%", left: "28%", size: 16, color: "#d4838f", delay: 0.9 },
  { top: "88%", left: "68%", size: 20, color: "#8b2252", delay: 2.7 },
  { top: "40%", left: "94%", size: 10, color: "#f4c2c2", delay: 0.4 },
  { top: "20%", left: "50%", size: 12, color: "#d4838f", delay: 3.1 },
  { top: "92%", left: "48%", size: 14, color: "#c41e3a", delay: 1.1 },
  { top: "6%", left: "36%", size: 10, color: "#f4c2c2", delay: 2.2 },
];

export function FloatingHearts() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="absolute select-none animate-float-heart"
          style={{
            top: h.top,
            left: h.left,
            fontSize: h.size,
            color: h.color,
            opacity: 0.45,
            animationDelay: `${h.delay}s`,
          }}
        >
          ♡
        </span>
      ))}
    </div>
  );
}
