import React, { useMemo, useState } from 'react';
import { subDays, format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HeatmapProps {
  data: Record<string, number>; // key: YYYY-MM-DD, value: durationMinutes
}

export function Heatmap({ data }: HeatmapProps) {
  const [view, setView] = useState<'year' | 'month'>('month');
  const today = new Date();

  const yearDays = useMemo(() => {
    const startDate = startOfWeek(subDays(today, 364));
    const daysArray = [];
    for (let i = 0; i < 371; i++) { // 53 weeks * 7 days
      const date = addDays(startDate, i);
      if (date > today) break;
      const dateString = format(date, 'yyyy-MM-dd');
      daysArray.push({ date, dateString, duration: data[dateString] || 0 });
    }
    return daysArray;
  }, [data]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start, end });
    
    // Pad start of month with empty days to align with weekday (0 = Sunday)
    const startDayOfWeek = getDay(start);
    const paddedDays = Array(startDayOfWeek).fill(null);
    
    const monthArray = daysInMonth.map(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      return { date, dateString, duration: data[dateString] || 0 };
    });
    
    return [...paddedDays, ...monthArray];
  }, [data]);

  const getColorClass = (duration: number) => {
    if (duration === 0) return 'bg-black/5 dark:bg-white/5';
    if (duration < 15) return 'bg-emerald-200 dark:bg-emerald-900';
    if (duration < 45) return 'bg-emerald-400 dark:bg-emerald-700';
    if (duration < 120) return 'bg-emerald-600 dark:bg-emerald-500';
    return 'bg-emerald-800 dark:bg-emerald-300';
  };

  // Group by weeks for year view
  const weeks = [];
  for (let i = 0; i < yearDays.length; i += 7) {
    weeks.push(yearDays.slice(i, i + 7));
  }

  const monthLabels: { month: string, index: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, index) => {
    // Use the middle of the week to determine the month
    const referenceDay = week.length > 3 ? week[3].date : week[0].date;
    const month = referenceDay.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ month: format(referenceDay, 'MMM'), index });
      lastMonth = month;
    }
  });

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-end w-full mb-4">
        <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setView('year')}
            className={cn(
              "px-3 py-1 text-sm font-medium rounded-md transition-colors",
              view === 'year' ? "bg-white/90 dark:bg-black/40 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            年
          </button>
          <button
            onClick={() => setView('month')}
            className={cn(
              "px-3 py-1 text-sm font-medium rounded-md transition-colors",
              view === 'month' ? "bg-white/90 dark:bg-black/40 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            月
          </button>
        </div>
      </div>

      {view === 'year' ? (
        <div className="flex flex-col items-start sm:items-center w-full overflow-x-auto pb-2">
          <div className="flex flex-col min-w-max mx-auto">
            <div className="relative h-4 mb-1 w-full">
              {monthLabels.map((label, i) => (
                <div
                  key={i}
                  className="absolute text-[10px] font-medium text-zinc-400"
                  style={{ left: `${label.index * 16}px` }}
                >
                  {label.month}
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.dateString}
                      className={cn(
                        "w-3 h-3 rounded-sm transition-colors duration-200",
                        getColorClass(day.duration)
                      )}
                      title={`${day.dateString}: ${day.duration} 分钟`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-medium text-zinc-400 w-6">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day, i) => (
              <div key={i} className="flex items-center justify-center w-6 h-6">
                {day ? (
                  <div
                    className={cn(
                      "w-4 h-4 rounded-sm transition-colors duration-200",
                      getColorClass(day.duration)
                    )}
                    title={`${day.dateString}: ${day.duration} 分钟`}
                  />
                ) : (
                  <div className="w-4 h-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-6 text-xs text-zinc-500">
        <span>少</span>
        <div className="w-3 h-3 rounded-sm bg-black/5 dark:bg-white/5" />
        <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
        <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
        <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
        <div className="w-3 h-3 rounded-sm bg-emerald-800 dark:bg-emerald-300" />
        <span>多</span>
      </div>
    </div>
  );
}
