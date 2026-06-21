import { trpc } from "@/providers/trpc";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  Award,
  Zap,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = {
  profit: "#22c55e",
  loss: "#ef4444",
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  accent: "#f59e0b",
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function Analytics() {
  const { data: stats } = trpc.analytics.getDashboardStats.useQuery();
  const { data: byStrategy } = trpc.analytics.getPerformanceByStrategy.useQuery();
  const { data: byMarket } = trpc.analytics.getPerformanceByMarket.useQuery();
  const { data: bySession } = trpc.analytics.getPerformanceBySession.useQuery();
  const { data: byDay } = trpc.analytics.getPerformanceByDayOfWeek.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Deep dive into your trading performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          title="Most Profitable Strategy"
          value={
            byStrategy && byStrategy.length > 0
              ? byStrategy.reduce((a, b) => (a.pnl > b.pnl ? a : b)).name
              : "—"
          }
          subtitle={
            byStrategy && byStrategy.length > 0
              ? `$${byStrategy.reduce((a, b) => (a.pnl > b.pnl ? a : b)).pnl.toFixed(0)}`
              : ""
          }
          icon={Target}
        />
        <SummaryCard
          title="Best Market"
          value={
            byMarket && byMarket.length > 0
              ? byMarket.reduce((a, b) => (a.pnl > b.pnl ? a : b)).name
              : "—"
          }
          subtitle={
            byMarket && byMarket.length > 0
              ? `$${byMarket.reduce((a, b) => (a.pnl > b.pnl ? a : b)).pnl.toFixed(0)}`
              : ""
          }
          icon={Award}
        />
        <SummaryCard
          title="Best Session"
          value={
            bySession && bySession.length > 0
              ? bySession.reduce((a, b) => (a.pnl > b.pnl ? a : b)).name
              : "—"
          }
          subtitle={
            bySession && bySession.length > 0
              ? `$${bySession.reduce((a, b) => (a.pnl > b.pnl ? a : b)).pnl.toFixed(0)}`
              : ""
          }
          icon={Zap}
        />
        <SummaryCard
          title="Avg Win / Avg Loss"
          value={stats ? `$${stats.avgWin}` : "—"}
          subtitle={stats ? `/$${stats.avgLoss}` : ""}
          icon={TrendingUp}
        />
      </div>

      {/* Performance Tabs */}
      <Tabs defaultValue="strategy" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="strategy" className="text-xs">
            By Strategy
          </TabsTrigger>
          <TabsTrigger value="market" className="text-xs">
            By Market
          </TabsTrigger>
          <TabsTrigger value="session" className="text-xs">
            By Session
          </TabsTrigger>
          <TabsTrigger value="day" className="text-xs">
            By Day
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strategy">
          <PerformanceTable
            title="Performance by Strategy"
            data={byStrategy || []}
            icon={Target}
          />
        </TabsContent>

        <TabsContent value="market">
          <PerformanceTable
            title="Performance by Market"
            data={byMarket || []}
            icon={Award}
          />
        </TabsContent>

        <TabsContent value="session">
          <PerformanceTable
            title="Performance by Session"
            data={bySession || []}
            icon={Zap}
          />
        </TabsContent>

        <TabsContent value="day">
          <PerformanceTable
            title="Performance by Day of Week"
            data={byDay || []}
            icon={Calendar}
          />
        </TabsContent>
      </Tabs>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* P&L by Strategy Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              P&L by Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {byStrategy && byStrategy.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byStrategy}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 18%)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(220 15% 8%)",
                        border: "1px solid hsl(220 12% 18%)",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {byStrategy.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.pnl >= 0 ? COLORS.profit : COLORS.loss}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No strategy data available" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Win Rate by Market */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Trade Distribution by Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {byMarket && byMarket.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={byMarket}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="trades"
                      nameKey="name"
                      label={({ name, trades }) => `${name}: ${trades}`}
                    >
                      {byMarket.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(220 15% 8%)",
                        border: "1px solid hsl(220 12% 18%)",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No market data available" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="h-4 w-4 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm font-bold mt-1 truncate">{value}</p>
        {subtitle && (
          <p className="text-xs text-green-500 mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceTable({
  title,
  data,
  icon: Icon,
}: {
  title: string;
  data: any[];
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No data available yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-right font-medium">Trades</th>
                  <th className="px-3 py-2 text-right font-medium">Wins</th>
                  <th className="px-3 py-2 text-right font-medium">Losses</th>
                  <th className="px-3 py-2 text-right font-medium">Win Rate</th>
                  <th className="px-3 py-2 text-right font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.name} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-3 py-2 font-medium">{item.name}</td>
                    <td className="px-3 py-2 text-right">{item.trades}</td>
                    <td className="px-3 py-2 text-right text-green-500">{item.wins}</td>
                    <td className="px-3 py-2 text-right text-red-500">{item.losses}</td>
                    <td className="px-3 py-2 text-right">{item.winRate}%</td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${
                        item.pnl >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      ${item.pnl.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground text-center max-w-[200px]">{message}</p>
    </div>
  );
}
