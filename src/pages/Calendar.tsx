import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData } = trpc.analytics.getCalendarData.useQuery({ year, month });
  const { data: allTrades } = trpc.trade.list.useQuery({});

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  // Create calendar grid
  const calendarDays: Array<{
    date: number;
    fullDate: string;
    status: "profit" | "loss" | "neutral" | "empty";
    pnl: number;
  }> = [];

  // Empty cells for days before the first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ date: 0, fullDate: "", status: "empty", pnl: 0 });
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const fullDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayData = calendarData?.find((d) => d.date === fullDate);
    calendarDays.push({
      date: day,
      fullDate,
      status: dayData ? (dayData.status as any) : "neutral",
      pnl: dayData?.pnl || 0,
    });
  }

  // Trades for selected day
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedTrades = selectedDate
    ? allTrades?.filter((t) => {
        const tradeDate = String(t.tradeDate).split("T")[0];
        return tradeDate === selectedDate && t.status === "Closed";
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trading Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Visualize your trading performance by day
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {MONTH_NAMES[month - 1]} {year}
              </CardTitle>
              <div className="flex gap-1">
                <button
                  onClick={prevMonth}
                  className="rounded-md p-1 hover:bg-accent text-muted-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="rounded-md p-1 hover:bg-accent text-muted-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-muted-foreground py-2 font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => day.date > 0 && setSelectedDate(day.fullDate)}
                  disabled={day.date === 0}
                  className={`
                    relative rounded-md p-2 text-center transition-all min-h-[60px] flex flex-col items-center justify-center
                    ${day.date === 0 ? "invisible" : ""}
                    ${
                      selectedDate === day.fullDate
                        ? "ring-2 ring-primary"
                        : "hover:bg-accent/50"
                    }
                    ${
                      day.status === "profit"
                        ? "bg-green-500/10 border border-green-500/20"
                        : day.status === "loss"
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-card border border-border"
                    }
                  `}
                >
                  <span className="text-sm font-medium">{day.date > 0 ? day.date : ""}</span>
                  {day.status !== "neutral" && day.status !== "empty" && (
                    <div className="mt-1 flex justify-center">
                      <div 
                        className={`h-2 w-2 rounded-full ${
                          day.status === "profit" ? "bg-green-500" : "bg-red-500"
                        }`} 
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-green-500/20 border border-green-500/30" />
                <span className="text-muted-foreground">Profitable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-red-500/20 border border-red-500/30" />
                <span className="text-muted-foreground">Losing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-card border border-border" />
                <span className="text-muted-foreground">No Trades</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Trades */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a day"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click on a calendar day to see trades
              </p>
            ) : selectedTrades && selectedTrades.length > 0 ? (
              <div className="space-y-3">
                {selectedTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="rounded-md border border-border p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{trade.market}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          trade.direction === "Buy"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{trade.strategy}</span>
                      <span
                        className={
                          Number(trade.profitLoss) >= 0 ? "text-green-500" : "text-red-500"
                        }
                      >
                        ${Number(trade.profitLoss).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {trade.result === "Win" ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : trade.result === "Loss" ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs">{trade.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No trades on this day
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
