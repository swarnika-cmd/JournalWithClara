# Clara — Coquette Scrapbook Journal App

A single-page experience with two views (Landing hero → Auth) styled as a handcrafted pink/cream scrapbook diary, using the uploaded journal photo as the ambient background.

## Scope

- Frontend only. No backend, no real auth wiring yet — forms are visual/local state (submit does nothing except a console log or toast). We can wire Lovable Cloud auth in a follow-up.
- Single route at `/` that switches between two views (`landing` and `auth`) via local state, with animated transition. No route change so the background stays continuous.

## Design system (added to `src/styles.css`)

Semantic tokens (all in oklch, mapped in `@theme inline`):
- `--blush`, `--dusty-rose`, `--deep-red`, `--ribbon-red`, `--cream`, `--paper`, `--ink-brown`, `--soft-charcoal`, `--gold`
- Reassign `--background` → cream, `--foreground` → ink-brown, `--primary` → dusty-rose, `--accent` → deep-red so shadcn components inherit the palette.

Fonts (loaded via `<link>` in `__root.tsx` head, per Tailwind v4 rules):
- Playfair Display (headings), Quicksand (body), Dancing Script (the "Clara" wordmark)
- Registered as `--font-display`, `--font-body`, `--font-script` in `@theme`.

Custom utilities (via `@utility`):
- `.dotted-underline` — dotted bottom border that transitions to solid on focus
- `.wax-seal` — pill button with inset shadow + deep-red bg
- `.paper-tag` — rounded tag-style button with thin dusty-rose border
- `.lace-border-top` / `.lace-border-bottom` — repeating CSS pattern strip
- `.float-heart` — keyframe drift animation (translateY ±8px, 4s infinite)

## Assets

Register the uploaded scrapbook photo as a Lovable Asset:
- `src/assets/journal-bg.png.asset.json` via `lovable-assets create --file /mnt/user-uploads/image.png`
- Used as the full-bleed background on both views (blur 2–3px, ~70% opacity, cream overlay).

## Files

- `src/routes/index.tsx` — replaces the placeholder. Holds `view` state (`"landing" | "auth"`), background layer, floating hearts, lace borders, gold "AI-Powered" sticker, and renders `<Landing/>` or `<AuthCloud/>` with fade+slide transition (Tailwind `animate-fade-in` / custom keyframes).
- `src/components/clara/Landing.tsx` — script "Clara" wordmark, tagline, subtagline, "🎀 Open My Journal" paper-tag CTA → sets view to `auth`.
- `src/components/clara/AuthCloud.tsx` — cloud-shaped frosted container (main rounded rect + 4 absolutely-positioned circles for puffs, hidden `md:` down to plain rounded rect on mobile). Contains:
  - Small "Clara" script header
  - Sign In / Sign Up tab toggle (paper tabs, active = cream bg + dusty-rose underline)
  - `<SignInForm/>` and `<SignUpForm/>` with crossfade
  - Divider with centered ♡
  - "Continue with Google" (and Apple) pill buttons
  - Tiny 🎀 sticker in top-right
  - "← back" link below cloud
- `src/components/clara/SignInForm.tsx`, `SignUpForm.tsx` — dotted-line inputs, wax-seal submit ("Enter" / "Begin My Journal"), local state only.
- `src/components/clara/FloatingHearts.tsx` — ~14 absolutely-positioned ♡ glyphs with staggered `float-heart` animation, opacity 0.3–0.5.

## Metadata

Update `__root.tsx` `head()`:
- title: "Clara — Your Voice. Your Memory. Your Story."
- description: "An AI voice journal that remembers everything. Talk to Clara every day."
- matching og:title/description, og:type=website, twitter:card=summary_large_image.
- Add `<link>` tags for the three Google Fonts.

## Responsive

- Desktop: cloud ~420×480, full puffs visible.
- Tablet: cloud scales to ~90% max 420px.
- Mobile (<768px): puff pseudo-circles hidden, cloud becomes a rounded (rounded-[32px]) frosted panel filling width minus 16px padding; background image `object-cover` with slight zoom.

## Animations

- Hero → Auth transition: hero fades+translates up (`opacity 1→0`, `translateY 0→-16px`, 500ms), then cloud fades in from below (`opacity 0→1`, `translateY 16px→0`, 500ms). Implemented with a keyed wrapper + `animate-fade-in` / new `animate-slide-up-in` keyframe.
- Hearts drift infinite 4s.
- Button hover: scale 1.03; active: scale 0.97.
- Inputs: dotted → solid underline on focus (CSS transition on `border-bottom-style` via swapping classes, or two layered borders).
- Tab crossfade: 300ms opacity.

## What NOT to do (guardrails carried from brief)

No flat white corporate card, no blue/tech palette, no sharp corners, no generic SaaS chrome. Everything rounded, warm, paper-textured.

## Out of scope for this pass

- Real authentication (Lovable Cloud) — offer as a follow-up once the visual is approved.
- Voice recording / AI chat with Clara — future work.
