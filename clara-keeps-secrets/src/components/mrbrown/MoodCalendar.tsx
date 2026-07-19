import { useState } from "react";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

interface DailyMood {
  avgScore: number;
  count: number;
}

interface MoodCalendarProps {
  dailyData: { [key: string]: DailyMood };
}

export function MoodCalendar({ dailyData }: MoodCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper: days in current month
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  // Helper: start day of month (0 = Sun, 6 = Sat)
  const getStartDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfMonth(year, month);

  // Mapped list of days to render
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const offsetArray = Array.from({ length: startDay }, (_, i) => i);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper: get color for mood score
  const getMoodColor = (score: number) => {
    if (score >= 4.5) return "#588157"; // Olive Forest Green (Very Positive)
    if (score >= 3.5) return "#A3B18A"; // Sage Green (Positive)
    if (score >= 2.5) return "#E9C46A"; // Warm Gold/Yellow (Neutral)
    if (score >= 1.5) return "#D4838F"; // Dusty Rose (Negative)
    return "#8B2252"; // Deep Red/Burgundy (Very Negative)
  };

  // Helper: get text label for mood score
  const getMoodLabel = (score: number) => {
    if (score >= 4.5) return "Very Positive";
    if (score >= 3.5) return "Positive";
    if (score >= 2.5) return "Neutral";
    if (score >= 1.5) return "Negative";
    return "Very Negative";
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Calendar Header Nav */}
      <div className="flex items-center justify-between border-b border-dusty-rose/10 pb-2.5">
        <h4 className="font-display font-semibold text-ink-brown text-sm">
          📅 {monthNames[month]} {year}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-dusty-rose/10 transition-colors text-dusty-rose"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-dusty-rose/10 transition-colors text-dusty-rose"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week Headers */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono text-soft-charcoal/50 uppercase tracking-wider">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 justify-items-center">
        {/* Fill offsets */}
        {offsetArray.map((offset) => (
          <div key={`offset-${offset}`} className="w-8 h-8" />
        ))}

        {/* Days */}
        {daysArray.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const moodInfo = dailyData[dateStr];
          const hasEntries = !!moodInfo;

          return (
            <div
              key={day}
              className="group relative w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono transition-all duration-200 select-none cursor-pointer"
              style={{
                background: hasEntries ? getMoodColor(moodInfo.avgScore) : "transparent",
                color: hasEntries ? "#fff" : "#3E2723",
                border: hasEntries ? "none" : "1px dotted rgba(212, 131, 143, 0.4)",
                boxShadow: hasEntries ? "0 2px 6px rgba(139, 34, 82, 0.15)" : "none"
              }}
            >
              <span>{day}</span>

              {/* Tooltip on hover */}
              <div
                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl border border-dusty-rose/25 bg-cream text-ink-brown font-body text-[11px] leading-relaxed shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 flex flex-col gap-1 text-left"
                style={{
                  boxShadow: "0 6px 20px rgba(139, 34, 82, 0.08)"
                }}
              >
                <div className="font-semibold text-dusty-rose border-b border-dusty-rose/5 pb-0.5 mb-1 font-display">
                  {monthNames[month]} {day}, {year}
                </div>
                {hasEntries ? (
                  <>
                    <div className="flex justify-between">
                      <span>Entries:</span>
                      <span className="font-semibold">{moodInfo.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Mood:</span>
                      <span className="font-semibold" style={{ color: getMoodColor(moodInfo.avgScore) }}>
                        {getMoodLabel(moodInfo.avgScore)}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-soft-charcoal/60 italic">No secret keepsakes recorded.</span>
                )}
                {/* Visual arrow indicator */}
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent"
                  style={{ borderTopColor: "rgba(255, 248, 240, 0.98)" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mood Map Legend */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-dusty-rose/10 text-[10px] font-body text-soft-charcoal/60">
        <span className="flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5 text-dusty-rose/60" /> Legend
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-[#8B2252]" title="Very Negative" />
          <div className="w-2.5 h-2.5 rounded bg-[#D4838F]" title="Negative" />
          <div className="w-2.5 h-2.5 rounded bg-[#E9C46A]" title="Neutral" />
          <div className="w-2.5 h-2.5 rounded bg-[#A3B18A]" title="Positive" />
          <div className="w-2.5 h-2.5 rounded bg-[#588157]" title="Very Positive" />
        </div>
      </div>
    </div>
  );
}
