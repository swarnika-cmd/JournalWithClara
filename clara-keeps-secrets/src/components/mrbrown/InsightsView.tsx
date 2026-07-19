import { useState, useEffect } from "react";
import { apiRequest } from "../../lib/api";
import { toast } from "sonner";
import { Sparkles, Calendar, Heart, Award, Compass, RefreshCw, ChevronDown, ChevronUp, AlertCircle, ArrowLeft } from "lucide-react";

interface Insight {
  id?: string;
  summary: string;
  themes: string[];
  moodArc: string;
  highlight: string;
  suggestion: string;
  weekStart: string;
  weekEnd: string;
  createdAt?: string;
}

interface InsightsViewProps {
  onBack: () => void;
}

export function InsightsView({ onBack }: InsightsViewProps) {
  const [latestInsight, setLatestInsight] = useState<Insight | null>(null);
  const [insightsHistory, setInsightsHistory] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setGenerationError(null);
    try {
      // 1. Fetch latest insight
      try {
        const latest = await apiRequest<Insight>("/insights/latest");
        setLatestInsight(latest);
      } catch (err: any) {
        // If 404, it just means no insights generated yet (which is a valid state)
        if (err.status !== 404) {
          throw err;
        }
        setLatestInsight(null);
      }

      // 2. Fetch history
      const historyData = await apiRequest<{ insights: Insight[] }>("/insights");
      setInsightsHistory(historyData.insights);
    } catch (err: any) {
      console.error("Failed to fetch insights:", err);
      toast.error(err.message || "Failed to load weekly insights");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    const toastId = toast.loading("Mr Brown is reading through your past entries to create your weekly keepsake...");
    
    try {
      const generated = await apiRequest<Insight>("/insights/generate", {
        method: "POST",
      });
      setLatestInsight(generated);
      toast.success("Keepsake summary generated successfully!", { id: toastId });
      
      // Refresh history list
      const historyData = await apiRequest<{ insights: Insight[] }>("/insights");
      setInsightsHistory(historyData.insights);
    } catch (err: any) {
      console.error("Generation error:", err);
      const errorMsg = err.message || "Failed to analyze entries.";
      setGenerationError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const startFormat = start.toLocaleDateString("en-US", options);
    const endFormat = end.toLocaleDateString("en-US", { ...options, year: "numeric" });
    
    return `${startFormat} — ${endFormat}`;
  };

  const toggleArchive = (id: string) => {
    if (expandedArchiveId === id) {
      setExpandedArchiveId(null);
    } else {
      setExpandedArchiveId(id);
    }
  };

  // Filter history to exclude the currently displayed latest insight
  const historyArchive = insightsHistory.filter(
    (ins) => ins.id !== latestInsight?.id
  );

  return (
    <div className="relative z-20 flex min-h-screen flex-col items-center justify-start px-4 py-16 animate-slide-up-in">
      <div className="w-full max-w-[600px] flex flex-col gap-6">
        
        {/* Top Header Card */}
        <div 
          className="relative rounded-[32px] p-6 text-center"
          style={{
            background: "rgba(255, 248, 240, 0.8)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(212, 131, 143, 0.3)",
            boxShadow: "0 8px 32px rgba(139, 34, 82, 0.08)",
          }}
        >
          <button
            onClick={onBack}
            className="absolute left-6 top-6 text-soft-charcoal/60 hover:text-deep-red transition-colors flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="h-3 w-3" /> Dashboard
          </button>
          
          <span className="text-3xl block mt-2 select-none mb-1">🌸</span>
          <h2 className="font-display text-ink-brown text-xl font-bold tracking-tight">Weekly Insights</h2>
          <p className="font-body text-soft-charcoal/70 text-xs mt-1 max-w-[340px] mx-auto">
            A weekly review of your thoughts, growth themes, and emotional patterns.
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-dusty-rose/20 border-t-dusty-rose animate-spin" />
            <p className="font-display text-ink-brown text-sm font-medium">Opening your insights journal...</p>
          </div>
        ) : latestInsight ? (
          // Main Weekly Insight Display
          <div className="flex flex-col gap-5">
            {/* Week Highlight Card */}
            <div 
              className="rounded-[32px] p-6 md:p-8 flex flex-col gap-5 border border-dusty-rose/20 shadow-md relative overflow-hidden"
              style={{ background: "rgba(255, 248, 240, 0.95)" }}
            >
              <div className="absolute top-0 right-0 h-24 w-24 bg-blush/10 rounded-bl-full pointer-events-none" />
              
              {/* Date Header */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-dusty-rose text-xs font-semibold uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5" /> Latest Review
                </span>
                <span className="text-xs font-mono text-soft-charcoal/60 font-semibold">
                  {formatDateRange(latestInsight.weekStart, latestInsight.weekEnd)}
                </span>
              </div>

              {/* Summary */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-body text-dusty-rose/80 font-bold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-deep-red" /> Mr Brown's Summary
                </span>
                <p className="font-body text-sm text-ink-brown leading-relaxed italic">
                  "{latestInsight.summary}"
                </p>
              </div>

              <hr className="border-dusty-rose/10" />

              {/* Themes */}
              {latestInsight.themes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-body text-soft-charcoal/60 font-bold">Growth Themes</span>
                  <div className="flex flex-wrap gap-2">
                    {latestInsight.themes.map((theme, i) => (
                      <span 
                        key={i} 
                        className="px-3 py-1 text-[11px] font-body rounded-full text-deep-red border border-dusty-rose/20"
                        style={{ background: "rgba(244, 194, 194, 0.25)" }}
                      >
                        🌸 {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mood Arc */}
              <div className="flex flex-col gap-2 bg-cream/30 p-4 rounded-2xl border border-dusty-rose/10">
                <span className="text-xs font-body text-soft-charcoal/60 font-bold flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-deep-red" /> Emotional Arc
                </span>
                <p className="font-body text-xs text-ink-brown leading-relaxed">
                  {latestInsight.moodArc}
                </p>
              </div>

              {/* Highlight Breakthrough */}
              <div className="flex flex-col gap-2 bg-white/50 p-4 rounded-2xl border border-dusty-rose/10 relative">
                <span className="text-xs font-body text-dusty-rose/80 font-bold flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-deep-red" /> Week Highlight
                </span>
                <p className="font-body text-xs text-ink-brown leading-relaxed pl-3 border-l-2 border-dusty-rose/30 italic">
                  {latestInsight.highlight}
                </p>
              </div>

              {/* Recommendation */}
              <div className="flex flex-col gap-2 bg-blush/5 p-4 rounded-2xl border border-dusty-rose/15">
                <span className="text-xs font-body text-deep-red font-bold flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 fill-deep-red text-deep-red" /> Caring Suggestion
                </span>
                <p className="font-body text-xs text-ink-brown leading-relaxed">
                  {latestInsight.suggestion}
                </p>
              </div>

              {/* Re-generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-2 text-xs font-body text-dusty-rose hover:text-deep-red font-medium flex items-center justify-center gap-1.5 self-center transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
                Reflect again on this week
              </button>
            </div>
          </div>
        ) : (
          // Empty State (No insights generated yet)
          <div 
            className="rounded-[32px] p-8 text-center flex flex-col items-center justify-center gap-6 border border-dusty-rose/20"
            style={{ background: "rgba(255, 248, 240, 0.95)" }}
          >
            <div className="h-16 w-16 rounded-full bg-blush/20 flex items-center justify-center text-2xl select-none">
              💭
            </div>
            
            <div className="flex flex-col gap-1.5 max-w-[320px]">
              <h3 className="font-display text-ink-brown font-semibold text-base">No Weekly Keepsakes Yet</h3>
              <p className="font-body text-soft-charcoal/70 text-xs leading-relaxed">
                When you record at least 3 journal entries, Mr Brown can reflect on your week and build a keepsake report of your emotional journey.
              </p>
            </div>

            {generationError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs max-w-[340px] text-left border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{generationError}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="wax-seal px-8 py-3.5 font-display text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Mr Brown is reflecting...
                </>
              ) : (
                <>
                  🌸 Reflect on my week
                </>
              )}
            </button>
          </div>
        )}

        {/* History Archive list */}
        {historyArchive.length > 0 && (
          <div className="flex flex-col gap-3 mt-4 animate-slide-up-in">
            <h3 className="font-display text-ink-brown font-bold text-xs uppercase tracking-wider pl-2">
              Previous Weeks Keepsakes
            </h3>
            
            <div className="flex flex-col gap-2.5">
              {historyArchive.map((arch) => {
                const isExpanded = expandedArchiveId === arch.id;
                return (
                  <div 
                    key={arch.id}
                    className="rounded-2xl border border-dusty-rose/20 overflow-hidden shadow-sm transition-all"
                    style={{ background: "rgba(255, 248, 240, 0.75)" }}
                  >
                    {/* Archive Header */}
                    <div 
                      onClick={() => toggleArchive(arch.id!)}
                      className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-blush/5 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2 text-ink-brown">
                        <Calendar className="h-3.5 w-3.5 text-dusty-rose" />
                        <span className="text-xs font-mono font-semibold">
                          {formatDateRange(arch.weekStart, arch.weekEnd)}
                        </span>
                      </div>
                      <div className="text-dusty-rose">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>

                    {/* Archive Body */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-dusty-rose/10 flex flex-col gap-4 animate-slide-down-in">
                        {/* Summary */}
                        <div className="flex flex-col gap-1.5 mt-2">
                          <span className="text-[10px] font-body text-dusty-rose font-bold">Mr Brown's Summary</span>
                          <p className="font-body text-xs text-ink-brown italic leading-relaxed">
                            "{arch.summary}"
                          </p>
                        </div>
                        
                        {/* Themes */}
                        {arch.themes.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-body text-soft-charcoal/50 font-bold">Themes</span>
                            <div className="flex flex-wrap gap-1.5">
                              {arch.themes.map((th, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2 py-0.5 text-[9px] rounded-full font-body text-deep-red"
                                  style={{ background: "rgba(244, 194, 194, 0.2)" }}
                                >
                                  🌸 {th}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendation */}
                        <div className="flex flex-col gap-1 bg-blush/5 p-3 rounded-xl border border-dusty-rose/10">
                          <span className="text-[10px] font-body text-deep-red font-bold flex items-center gap-1">
                            <Heart className="h-3 w-3 fill-deep-red text-deep-red" /> Recommendation
                          </span>
                          <p className="font-body text-[11px] text-ink-brown leading-relaxed">
                            {arch.suggestion}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
