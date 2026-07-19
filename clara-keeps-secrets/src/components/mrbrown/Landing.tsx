export function Landing({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-center animate-slide-up-in">
      <h1
        className="font-script text-dusty-rose"
        style={{
          fontSize: "clamp(72px, 14vw, 140px)",
          lineHeight: 1,
          textShadow: "1px 2px 0 rgba(139, 34, 82, 0.15), 0 4px 20px rgba(212, 131, 143, 0.35)",
        }}
      >
        Mr Brown
      </h1>
      <p className="mt-6 font-display italic text-ink-brown" style={{ fontSize: 20 }}>
        Your Voice. Your Memory. Your Story.
      </p>
      <p className="mt-3 font-body text-ink-brown/80" style={{ fontSize: 14 }}>
        Talk to Mr Brown every day. He remembers everything.
      </p>

      <button onClick={onOpen} className="paper-tag mt-10" style={{ fontSize: 15 }}>
        <span>🎀</span>
        <span>Open My Journal</span>
      </button>

      <div
        className="absolute bottom-8 right-8 grid h-20 w-20 place-items-center rounded-full bg-cream text-center font-display"
        style={{
          color: "#d4a574",
          fontSize: 11,
          lineHeight: 1.2,
          boxShadow: "0 6px 18px rgba(212, 165, 116, 0.35), inset 0 0 0 1px rgba(212, 165, 116, 0.3)",
          transform: "rotate(-8deg)",
        }}
      >
        <span>
          ✨<br />AI-Powered
        </span>
      </div>
    </div>
  );
}
