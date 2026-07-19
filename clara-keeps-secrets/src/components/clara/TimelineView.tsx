import { useState, useEffect } from "react";
import { apiRequest } from "../../lib/api";
import { toast } from "sonner";
import { Trash2, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";

interface Entry {
  id: string;
  transcript: string;
  claraResponse: string | null;
  createdAt: string;
  moodScore: number | null;
  moodLabel: string | null;
  moodReason: string | null;
}

interface TimelineViewProps {
  onBack: () => void;
  onNewEntry: () => void;
}

export function TimelineView({ onBack, onNewEntry }: TimelineViewProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch entries
  useEffect(() => {
    async function fetchEntries() {
      setIsLoading(true);
      try {
        const query = `/entries?page=1&limit=10&search=${encodeURIComponent(debouncedSearch)}`;
        const data = await apiRequest<{
          entries: Entry[];
          totalCount: number;
          page: number;
          totalPages: number;
        }>(query);

        setEntries(data.entries);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        console.error("Fetch entries error:", err);
        toast.error("Failed to load entries history");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntries();
  }, [debouncedSearch]);

  // Load more entries
  const loadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const query = `/entries?page=${nextPage}&limit=10&search=${encodeURIComponent(debouncedSearch)}`;
      const data = await apiRequest<{
        entries: Entry[];
        totalCount: number;
        page: number;
        totalPages: number;
      }>(query);

      setEntries((prev) => [...prev, ...data.entries]);
      setPage(nextPage);
    } catch (err: any) {
      console.error("Load more error:", err);
      toast.error("Failed to load more entries");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Delete entry
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiRequest(`/entries/${id}`, {
        method: "DELETE",
      });

      toast.success("Entry removed from your diary.");
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotalCount((prev) => prev - 1);
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete entry");
    } finally {
      setDeletingId(null);
    }
  };

  // Group entries by Date
  const groupEntriesByDate = () => {
    const groups: { [key: string]: Entry[] } = {};

    entries.forEach((entry) => {
      const date = new Date(entry.createdAt);
      const dateString = date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(entry);
    });

    return groups;
  };

  const groupedEntries = groupEntriesByDate();

  return (
    <div className="relative z-20 flex min-h-screen flex-col items-center px-4 py-16 animate-slide-up-in w-full max-w-[500px] mx-auto">
      {/* Container Card */}
      <div
        className="w-full rounded-[32px] px-5 py-6 md:px-7 md:py-8 flex flex-col min-h-[500px]"
        style={{
          background: "rgba(255, 248, 240, 0.78)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(212, 131, 143, 0.3)",
          boxShadow: "0 8px 32px rgba(139, 34, 82, 0.12)",
        }}
      >
        <span className="absolute right-4 top-3 text-2xl select-none" style={{ transform: "rotate(15deg)" }}>🎀</span>
        <h2 className="font-script text-dusty-rose text-center mb-1" style={{ fontSize: 36, lineHeight: 1 }}>Clara</h2>
        <h3 className="font-display text-ink-brown text-lg text-center mb-5">Diary Timeline</h3>

        {/* Search Bar */}
        <div className="relative mb-6 flex items-center">
          <input
            className="dotted-line-input pr-10"
            type="text"
            placeholder="Search my secrets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute right-2 top-2 h-4 w-4 text-dusty-rose/60" />
        </div>

        {/* Content Body */}
        {isLoading && entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-dusty-rose animate-spin mb-2" />
            <span className="font-body text-xs text-soft-charcoal/70">Unlocking memory chest...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="text-3xl mb-3 select-none">🗝️</span>
            <h4 className="font-display text-ink-brown text-base mb-2">No keepsakes found</h4>
            <p className="font-body text-xs text-soft-charcoal/70 max-w-[220px] mb-6">
              {search ? "No past entries match your search query." : "You haven't recorded any entries yet."}
            </p>
            {!search && (
              <button onClick={onNewEntry} className="wax-seal px-6 py-2.5">
                Start Writing
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto max-h-[400px] pr-1">
            {Object.keys(groupedEntries).map((dateStr) => (
              <div key={dateStr} className="flex flex-col gap-3">
                {/* Date stamp header */}
                <h4 className="font-display text-xs font-semibold text-dusty-rose border-b border-dusty-rose/10 pb-1 pl-1">
                  📅 {dateStr}
                </h4>

                {/* Date Group List */}
                <div className="flex flex-col gap-2.5">
                  {groupedEntries[dateStr].map((entry) => {
                    const isExpanded = expandedId === entry.id;
                    const timeStr = new Date(entry.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-dusty-rose/25 bg-cream/30 hover:bg-cream/50 transition-all overflow-hidden"
                      >
                        {/* Header click bar */}
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                        >
                          <div className="flex flex-col text-left gap-0.5">
                            <span className="font-mono text-[10px] text-soft-charcoal/60">{timeStr}</span>
                            <span className="font-body text-sm text-ink-brown line-clamp-1 pr-4">
                              {entry.transcript}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {entry.moodScore && (
                              <span 
                                className="h-2 w-2 rounded-full" 
                                style={{
                                  background: entry.moodScore >= 4.5 ? "#588157" :
                                              entry.moodScore >= 3.5 ? "#A3B18A" :
                                              entry.moodScore >= 2.5 ? "#E9C46A" :
                                              entry.moodScore >= 1.5 ? "#D4838F" : "#8B2252"
                                }}
                                title={entry.moodLabel || "Mood Indicator"}
                              />
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-dusty-rose" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-dusty-rose" />
                            )}
                          </div>
                        </div>

                        {/* Expandable details content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 flex flex-col gap-3 text-left animate-slide-up-in border-t border-dusty-rose/10">
                            {/* User transcript */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-body text-soft-charcoal/60">My thoughts:</span>
                              <div
                                className="px-4 py-3 font-display italic text-sm text-ink-brown rounded-xl border border-dusty-rose/20 shadow-inner"
                                style={{
                                  background: "repeating-linear-gradient(#fcfcfc, #fcfcfc 24px, #e8d0d4 25px)",
                                  lineHeight: "25px",
                                }}
                              >
                                {entry.transcript}
                              </div>
                            </div>

                            {/* Mood Analysis Details */}
                            {entry.moodLabel && (
                              <div className="flex flex-col gap-1 mt-1 animate-fade-in">
                                <span className="text-[10px] font-body text-soft-charcoal/60">Mood analysis:</span>
                                <div className="flex flex-col gap-1 bg-cream/20 border border-dusty-rose/10 rounded-xl p-3">
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="h-2.5 w-2.5 rounded-full" 
                                      style={{
                                        background: entry.moodScore && entry.moodScore >= 4.5 ? "#588157" :
                                                    entry.moodScore && entry.moodScore >= 3.5 ? "#A3B18A" :
                                                    entry.moodScore && entry.moodScore >= 2.5 ? "#E9C46A" :
                                                    entry.moodScore && entry.moodScore >= 1.5 ? "#D4838F" : "#8B2252"
                                      }}
                                    />
                                    <span className="font-display font-semibold text-xs text-ink-brown">
                                      {entry.moodLabel} (Score: {entry.moodScore}/5)
                                    </span>
                                  </div>
                                  {entry.moodReason && (
                                    <p className="font-body text-[11px] text-soft-charcoal/80 italic mt-0.5 leading-relaxed">
                                      "{entry.moodReason}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Clara reply */}
                            {entry.claraResponse && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-body text-dusty-rose font-medium">🎀 Clara's Reply:</span>
                                <div className="rounded-xl px-4 py-3 font-body text-xs text-ink-brown border border-dusty-rose/15 bg-cream/85">
                                  {entry.claraResponse}
                                </div>
                              </div>
                            )}

                            {/* Options row */}
                            <div className="flex justify-end mt-1 border-t border-dusty-rose/5 pt-2">
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this keepsake from your journal?")) {
                                    handleDelete(entry.id);
                                  }
                                }}
                                disabled={deletingId === entry.id}
                                className="flex items-center gap-1 text-xs text-soft-charcoal/60 hover:text-red-600 transition-colors py-1 px-2 rounded-lg hover:bg-red-50"
                              >
                                {deletingId === entry.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                <span>Delete Keepsake</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load More pagination button */}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="text-xs font-body text-dusty-rose hover:text-deep-red transition-all py-2.5 mt-2 flex items-center justify-center gap-1.5"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading more memories...</span>
                  </>
                ) : (
                  <span>Load older memories</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="mt-8 font-body text-sm text-soft-charcoal/70 hover:text-deep-red transition-colors animate-fade-in"
      >
        ← back to dashboard
      </button>
    </div>
  );
}
