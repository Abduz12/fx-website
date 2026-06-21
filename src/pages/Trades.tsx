import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import {
  Search,
  Filter,
  
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const markets = [
  "all",
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "NAS100",
  "US30",
  "BTCUSD",
  "ETHUSD",
  "Other",
];
const strategies = [
  "all",
  "ICT Smart Money Concepts",
  "Breakout Retest",
  "Supply and Demand",
  "Trend Following",
  "Scalping",
  "News Trading",
  "Other",
];
const results = ["all", "Win", "Loss", "Break Even"];
const sessions = ["all", "Asian", "London", "New York"];

export default function Trades() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    market: "all",
    strategy: "all",
    result: "all",
    session: "all",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { data: trades, isLoading } = trpc.trade.list.useQuery({
    market: filters.market !== "all" ? filters.market : undefined,
    strategy: filters.strategy !== "all" ? filters.strategy : undefined,
    result: filters.result !== "all" ? filters.result : undefined,
    session: filters.session !== "all" ? filters.session : undefined,
  });

  const filteredTrades = trades
    ? trades.filter((trade) => {
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return (
            trade.market.toLowerCase().includes(search) ||
            trade.strategy.toLowerCase().includes(search) ||
            trade.direction.toLowerCase().includes(search)
          );
        }
        return true;
      })
    : [];

  const totalPages = Math.ceil((filteredTrades?.length || 0) / itemsPerPage);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all your trades
          </p>
        </div>
        <Button onClick={() => navigate("/trades/new")}>
          <TrendingUp className="mr-2 h-4 w-4" />
          New Trade
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search trades..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? "-" : "+"}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Market</label>
                <select
                  value={filters.market}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, market: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {markets.map((m) => (
                    <option key={m} value={m}>
                      {m === "all" ? "All Markets" : m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Strategy</label>
                <select
                  value={filters.strategy}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, strategy: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {strategies.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "All Strategies" : s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Result</label>
                <select
                  value={filters.result}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, result: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {results.map((r) => (
                    <option key={r} value={r}>
                      {r === "all" ? "All Results" : r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Session</label>
                <select
                  value={filters.session}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, session: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {sessions.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "All Sessions" : s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {filteredTrades.length} Trades Found
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Market</th>
                  <th className="px-4 py-3 text-left font-medium">Dir</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Strategy</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Session</th>
                  <th className="px-4 py-3 text-right font-medium">Entry</th>
                  <th className="px-4 py-3 text-right font-medium">P&L</th>
                  <th className="px-4 py-3 text-center font-medium">Result</th>
                  <th className="px-4 py-3 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginatedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      No trades found. Start by adding your first trade.
                    </td>
                  </tr>
                ) : (
                  paginatedTrades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/trades/${trade.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(trade.tradeDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium">{trade.market}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                            trade.direction === "Buy"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                        {trade.strategy}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {trade.session}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {Number(trade.entryPrice).toFixed(
                          trade.market.includes("JPY") ? 3 : trade.market.includes("BTC") || trade.market.includes("ETH") ? 2 : 5
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {trade.profitLoss !== null ? (
                          <span
                            className={
                              Number(trade.profitLoss) >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            ${Number(trade.profitLoss).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          {trade.result === "Win" ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : trade.result === "Loss" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : trade.status === "Open" ? (
                            <span className="text-xs text-muted-foreground">Open</span>
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/trades/${trade.id}`);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
