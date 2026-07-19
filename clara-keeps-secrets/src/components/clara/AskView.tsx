import { useState } from "react";
import { apiRequest } from "../../lib/api";
import { toast } from "sonner";
import { Search, Loader2, ArrowRight, Calendar, Sparkles } from "lucide-react";

interface Source {
  id: string;
  transcript: string;
  claraResponse: string | null;
  createdAt: string;
}

interface RAGResponse {
  answer: string;
  sources: Source[];
}

interface AskViewProps {
  onBack: () => void;
  onViewEntry: (dateStr: string) => void;
}

export function AskView({ onBack, onViewEntry }: AskViewProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const suggestedQuestions = [
    "What makes me feel happy?",
    "When did I last mention being stressed?",
    "What are my goals or focus areas?",
    "Have I been sleeping well lately?"
  ];

  const handleSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setQuestion(queryText);
    setIsLoading(true);
    setHasSearched(true);
    setAnswer("");
    setSources([]);

    try {
      const data = await apiRequest<RAGResponse>("/entries/ask", {
        method: "POST",
        body: JSON.stringify({ question: queryText }),
      });

      setAnswer(data.answer);
      setSources(data.sources);
    } catch (err: any) {
      console.error("RAG search error:", err);
      toast.error(err.message || "Failed to search your diary history");
      setAnswer("I'm sorry, I couldn't look that up for you right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="relative z-20 flex min-h-screen flex-col items-center justify-start px-4 py-16 animate-slide-up-in">
      <div className="w-full max-w-[640px] flex flex-col gap-6">
        
        {/* Main RAG Search Card */}
        <div
          className="relative rounded-[32px] px-6 py-8 md:px-8 md:py-10 text-center"
          style={{
            background: "rgba(255, 248, 240, 0.8)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(212, 131, 143, 0.3)",
            boxShadow: "0 8px 32px rgba(139, 34, 82, 0.1)",
          }}
        >
          <span className="absolute right-6 top-5 text-2xl select-none" style={{ transform: "rotate(-10deg)" }}>🔍</span>
          <h2 className="font-script text-dusty-rose mb-2" style={{ fontSize: 36, lineHeight: 1 }}>Ask Clara</h2>
          <p className="font-body text-soft-charcoal text-sm max-w-[400px] mx-auto mb-6">
            Ask questions about your past diary logs and Clara will retrieve your memories to answer you.
          </p>

          {/* Search Box */}
          <div className="relative flex items-center gap-2 mb-4 w-full">
            <input
              type="text"
              placeholder="e.g. When was I last stressed about work?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(question)}
              disabled={isLoading}
              className="w-full px-5 py-3.5 pr-12 font-body text-sm rounded-full border border-dusty-rose/30 text-ink-brown placeholder-soft-charcoal/50 bg-cream/40 focus:outline-none focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose shadow-inner transition-all"
            />
            <button
              onClick={() => handleSearch(question)}
              disabled={isLoading || !question.trim()}
              className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-dusty-rose text-white hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-40 transition-all shadow-md"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          </div>

          {/* Suggested Query Chips */}
          {!hasSearched && (
            <div className="flex flex-wrap justify-center gap-2 mt-4 animate-fade-in">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(q)}
                  className="px-4 py-2 font-body text-xs text-dusty-rose hover:text-deep-red rounded-full border border-dusty-rose/25 bg-white/50 hover:bg-blush/20 transition-all cursor-pointer"
                >
                  ✨ {q}
                </button>
              ))}
            </div>
          )}

          {/* Thinking State */}
          {isLoading && (
            <div className="flex flex-col items-center gap-4 py-12 animate-fade-in">
              <div className="h-10 w-10 rounded-full border-4 border-dusty-rose/20 border-t-dusty-rose animate-spin" />
              <p className="font-display text-ink-brown text-sm font-medium">Clara is reading through your past journal entries...</p>
            </div>
          )}

          {/* Answer State */}
          {hasSearched && !isLoading && answer && (
            <div className="flex flex-col gap-6 text-left mt-6 animate-fade-in">
              {/* Answer Chat Bubble */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-body text-dusty-rose pl-2 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Clara's Answer:
                </span>
                <div
                  className="w-full rounded-2xl px-5 py-4 font-body text-sm text-ink-brown border border-dusty-rose/20 leading-relaxed shadow-sm"
                  style={{
                    background: "rgba(255, 248, 240, 0.95)",
                  }}
                >
                  {answer}
                </div>
              </div>

              {/* Memory Sources References */}
              {sources.length > 0 && (
                <div className="flex flex-col gap-3 mt-2 animate-slide-up-in">
                  <span className="text-xs font-body text-soft-charcoal/70 pl-2 font-semibold uppercase tracking-wider">
                    Retrieved Diary Contexts:
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sources.map((src) => {
                      const dayStr = src.createdAt.split("T")[0];
                      return (
                        <div
                          key={src.id}
                          onClick={() => onViewEntry(dayStr)}
                          className="flex flex-col p-4 rounded-2xl border border-dusty-rose/25 bg-white/40 hover:bg-blush/10 hover:border-dusty-rose/50 transition-all cursor-pointer shadow-sm group"
                        >
                          <div className="flex items-center gap-1.5 mb-1.5 text-dusty-rose">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs font-body font-semibold group-hover:text-deep-red transition-colors">
                              {new Date(src.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                          <p className="font-display italic text-ink-brown text-xs line-clamp-3 leading-relaxed">
                            "{src.transcript}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onBack}
          className="self-center font-body text-sm text-soft-charcoal/70 hover:text-deep-red transition-colors"
        >
          ← back to dashboard
        </button>
      </div>
    </div>
  );
}
