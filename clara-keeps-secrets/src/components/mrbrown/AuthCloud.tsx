import { useState } from "react";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

export function AuthCloud({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"in" | "up">("in");

  return (
    <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 py-16 animate-slide-up-in">
      <div className="relative w-full max-w-[420px]">
        {/* Cloud puffs — desktop only */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="absolute -top-10 left-8 h-24 w-24 rounded-full" style={cloudStyle} />
          <div className="absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full" style={cloudStyle} />
          <div className="absolute -top-8 right-6 h-20 w-20 rounded-full" style={cloudStyle} />
          <div className="absolute -left-6 top-1/3 h-20 w-20 rounded-full" style={cloudStyle} />
          <div className="absolute -right-6 top-1/2 h-24 w-24 rounded-full" style={cloudStyle} />
          <div className="absolute -bottom-6 left-1/4 h-16 w-16 rounded-full" style={cloudStyle} />
          <div className="absolute -bottom-8 right-1/4 h-20 w-20 rounded-full" style={cloudStyle} />
        </div>

        {/* Main cloud body */}
        <div
          className="relative rounded-[32px] px-7 py-8 md:px-9 md:py-10"
          style={{
            background: "rgba(255, 248, 240, 0.78)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(212, 131, 143, 0.3)",
            boxShadow: "0 8px 32px rgba(139, 34, 82, 0.12)",
          }}
        >
          <span className="absolute right-4 top-3 text-2xl select-none" style={{ transform: "rotate(15deg)" }}>🎀</span>

          <div className="text-center">
            <h2 className="font-script text-dusty-rose" style={{ fontSize: 36, lineHeight: 1 }}>Clara</h2>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex justify-center gap-2">
            <TabButton active={tab === "in"} onClick={() => setTab("in")}>Sign In</TabButton>
            <TabButton active={tab === "up"} onClick={() => setTab("up")}>Sign Up</TabButton>
          </div>

          {/* Form (crossfade) */}
          <div className="relative mt-6">
            <div key={tab} className="animate-slide-up-in">
              {tab === "in" ? <SignInForm /> : <SignUpForm />}
            </div>
          </div>

          {/* Divider with heart */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #d4838f 50%, transparent)" }} />
            <span className="text-dusty-rose">♡</span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, #d4838f 50%, transparent)" }} />
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <SocialButton>
              <GoogleIcon />
              <span>Continue with Google</span>
            </SocialButton>
            <SocialButton>
              <AppleIcon />
              <span>Continue with Apple</span>
            </SocialButton>
          </div>
        </div>
      </div>

      <button
        onClick={onBack}
        className="mt-8 font-body text-sm text-soft-charcoal/70 hover:text-deep-red transition-colors"
      >
        ← back
      </button>
    </div>
  );
}

const cloudStyle: React.CSSProperties = {
  background: "rgba(255, 248, 240, 0.78)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(212, 131, 143, 0.3)",
  boxShadow: "0 8px 32px rgba(139, 34, 82, 0.08)",
};

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-5 py-2 font-display transition-all duration-300"
      style={{
        fontSize: 15,
        borderRadius: "14px 14px 4px 4px",
        background: active ? "rgba(255, 248, 240, 0.9)" : "transparent",
        color: active ? "#3e2723" : "#5d4037",
        opacity: active ? 1 : 0.6,
        boxShadow: active ? "0 2px 6px rgba(139, 34, 82, 0.08)" : "none",
      }}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: "#d4838f" }} />
      )}
    </button>
  );
}

function SocialButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-3 rounded-full border py-2.5 font-body text-sm text-ink-brown transition-all hover:bg-blush/40"
      style={{ background: "rgba(255, 248, 240, 0.85)", borderColor: "rgba(212, 131, 143, 0.5)" }}
    >
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#3e2723"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
  );
}
