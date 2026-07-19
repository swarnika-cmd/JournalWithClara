import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import journalBg from "../assets/journal-bg.png.asset.json";
import { Landing } from "../components/clara/Landing";
import { AuthCloud } from "../components/clara/AuthCloud";
import { FloatingHearts } from "../components/clara/FloatingHearts";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { RecordView } from "../components/clara/RecordView";
import { TimelineView } from "../components/clara/TimelineView";
import { MoodCalendar } from "../components/clara/MoodCalendar";
import { AskView } from "../components/clara/AskView";
import { InsightsView } from "../components/clara/InsightsView";
import { apiRequest } from "../lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AuthProvider>
      <ClaraJournalMain />
    </AuthProvider>
  );
}

interface StatsData {
  totalCount: number;
  avgMood: number;
  streak: number;
  dailyData: any;
}

function ClaraJournalMain() {
  const [view, setView] = useState<"landing" | "auth">("landing");
  const [dashboardView, setDashboardView] = useState<"home" | "record" | "timeline" | "ask" | "insights">("home");
  const { user, logout, isLoading } = useAuth();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Load stats and recent entries when authenticated and on home tab
  useEffect(() => {
    if (!user || dashboardView !== "home") return;

    async function loadDashboardData() {
      setIsLoadingStats(true);
      try {
        const statsData = await apiRequest<StatsData>("/entries/mood-stats");
        setStats(statsData);

        const entriesData = await apiRequest<{ entries: any[] }>("/entries?page=1&limit=3");
        setRecentEntries(entriesData.entries);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoadingStats(false);
      }
    }

    loadDashboardData();
  }, [user, dashboardView]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      {/* Background journal image */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${journalBg.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(3px)",
          opacity: 0.7,
          transform: "scale(1.05)",
        }}
      />
      {/* Warm cream overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "linear-gradient(180deg, rgba(255,248,240,0.55) 0%, rgba(250,243,235,0.65) 100%)" }}
      />

      {/* Lace borders */}
      <div className="lace-strip pointer-events-none fixed inset-x-0 top-0 z-10" />
      <div className="lace-strip pointer-events-none fixed inset-x-0 bottom-0 z-10" />

      <FloatingHearts />

      {isLoading ? (
        <div className="relative z-20 flex min-h-screen items-center justify-center">
          <div className="text-center font-display text-ink-brown animate-pulse">
            Opening your journal...
          </div>
        </div>
      ) : user ? (
        <>
          {dashboardView === "record" ? (
            <RecordView onBack={() => setDashboardView("home")} />
          ) : dashboardView === "timeline" ? (
            <TimelineView onBack={() => setDashboardView("home")} onNewEntry={() => setDashboardView("record")} />
          ) : dashboardView === "ask" ? (
            <AskView onBack={() => setDashboardView("home")} onViewEntry={() => setDashboardView("timeline")} />
          ) : dashboardView === "insights" ? (
            <InsightsView onBack={() => setDashboardView("home")} />
          ) : (
            <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 pb-28 pt-12 animate-fade-in w-full">
              <div className="relative w-full max-w-[465px]">
                {/* Main dashboard card */}
                <div
                  className="relative rounded-[32px] px-6 py-7 text-center flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
                  style={{
                    background: "rgba(255, 248, 240, 0.82)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(212, 131, 143, 0.3)",
                    boxShadow: "0 8px 32px rgba(139, 34, 82, 0.12)",
                  }}
                >
                  <span className="absolute right-4 top-3 text-2xl select-none" style={{ transform: "rotate(15deg)" }}>🎀</span>
                  <h2 className="font-script text-dusty-rose mb-1" style={{ fontSize: 36, lineHeight: 1 }}>Clara</h2>
                  
                  <div className="text-center">
                    <h3 className="font-display text-ink-brown text-base font-semibold">Welcome back, {user.name}!</h3>
                    <p className="font-body text-soft-charcoal/70 text-[11px] mt-0.5">
                      Your secrets are safe here. Speak freely to begin writing.
                    </p>
                  </div>

                  {/* Stats Row */}
                  {stats && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-display">
                      <div className="bg-cream/40 border border-dusty-rose/10 rounded-xl py-2 flex flex-col gap-0.5">
                        <span className="text-soft-charcoal/50 text-[9px] uppercase tracking-wider">Streak</span>
                        <span className="font-semibold text-deep-red font-mono">🔥 {stats.streak} {stats.streak === 1 ? "day" : "days"}</span>
                      </div>
                      <div className="bg-cream/40 border border-dusty-rose/10 rounded-xl py-2 flex flex-col gap-0.5">
                        <span className="text-soft-charcoal/50 text-[9px] uppercase tracking-wider">Entries</span>
                        <span className="font-semibold text-ink-brown font-mono">📚 {stats.totalCount}</span>
                      </div>
                      <div className="bg-cream/40 border border-dusty-rose/10 rounded-xl py-2 flex flex-col gap-0.5">
                        <span className="text-soft-charcoal/50 text-[9px] uppercase tracking-wider">Avg Mood</span>
                        <span className="font-semibold text-dusty-rose font-mono">🌸 {stats.avgMood}</span>
                      </div>
                    </div>
                  )}

                  {/* Heatmap Calendar */}
                  {stats && (
                    <div className="bg-cream/35 border border-dusty-rose/15 rounded-2xl p-4 shadow-inner">
                      <MoodCalendar dailyData={stats.dailyData} />
                    </div>
                  )}

                  {/* Recent Entries snippets */}
                  <div className="flex flex-col gap-2.5 text-left mt-1">
                    <h4 className="font-display font-semibold text-xs text-dusty-rose pl-1">Recent Keepsakes</h4>
                    {recentEntries.length === 0 ? (
                      <span className="text-xs italic text-soft-charcoal/60 pl-1">No keepsakes recorded yet.</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {recentEntries.map((e) => {
                          const dateString = new Date(e.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          });
                          return (
                            <div
                              key={e.id}
                              onClick={() => setDashboardView("timeline")}
                              className="px-3.5 py-2.5 rounded-xl border border-dusty-rose/15 bg-cream/30 hover:bg-cream/60 transition-colors cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div className="flex flex-col text-left gap-0.5 max-w-[80%]">
                                <span className="font-mono text-[9px] text-soft-charcoal/50">{dateString}</span>
                                <span className="font-body text-ink-brown truncate">{e.transcript}</span>
                              </div>
                              {e.moodScore && (
                                <span 
                                  className="h-2 w-2 rounded-full" 
                                  style={{
                                    background: e.moodScore >= 4.5 ? "#588157" :
                                                e.moodScore >= 3.5 ? "#A3B18A" :
                                                e.moodScore >= 2.5 ? "#E9C46A" :
                                                e.moodScore >= 1.5 ? "#D4838F" : "#8B2252"
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2.5 w-full mt-2">
                    <button className="wax-seal w-full py-3" onClick={() => setDashboardView("record")}>
                      🎙️ Start Voice Entry
                    </button>
                    <button 
                      className="mt-1 font-body text-xs text-dusty-rose hover:text-deep-red transition-colors"
                      onClick={() => setDashboardView("insights")}
                    >
                      🌸 View Weekly Keepsakes & Insights
                    </button>
                    <button 
                      onClick={logout}
                      className="font-body text-[11px] text-soft-charcoal/60 hover:text-deep-red transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Tab Bar (only on home & timeline for clean flow) */}
          {dashboardView !== "record" && (
            <div 
              className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 flex items-center gap-8 border border-dusty-rose/30 shadow-lg backdrop-blur-md z-30 animate-fade-in"
              style={{
                background: "rgba(255, 248, 240, 0.92)",
              }}
            >
              <NavTabButton active={dashboardView === "home"} onClick={() => setDashboardView("home")} label="Home" icon="🏠" />
              <NavTabButton active={false} onClick={() => setDashboardView("record")} label="Record" icon="🎙️" />
              <NavTabButton active={dashboardView === "timeline"} onClick={() => setDashboardView("timeline")} label="Timeline" icon="📅" />
              <NavTabButton active={dashboardView === "ask"} onClick={() => setDashboardView("ask")} label="Ask Clara" icon="🔍" />
              <NavTabButton active={dashboardView === "insights"} onClick={() => setDashboardView("insights")} label="Insights" icon="🌸" />
            </div>
          )}
        </>
      ) : view === "landing" ? (
        <Landing onOpen={() => setView("auth")} />
      ) : (
        <AuthCloud onBack={() => setView("landing")} />
      )}
    </div>
  );
}

function NavTabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 font-body text-[11px] transition-all hover:scale-105 ${
        active ? "text-deep-red opacity-100 font-semibold" : "text-soft-charcoal opacity-60"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-dusty-rose mt-0.5" />
      )}
    </button>
  );
}

