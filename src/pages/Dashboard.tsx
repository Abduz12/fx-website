import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  
  BarChart3,
  Target,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Percent,
  Clock,
  Briefcase,
  Plus,
  DollarSign,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = {
  profit: "#22c55e",
  loss: "#ef4444",
  neutral: "#6b7280",
  primary: "#3b82f6",
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: accounts, refetch: refetchAccounts } = trpc.accounts.getAll.useQuery();
  const activeAccount = accounts?.find(a => a.isDefault);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.analytics.getDashboardStats.useQuery();
  const { data: equityCurve, refetch: refetchEquity } = trpc.analytics.getEquityCurve.useQuery();
  const { data: monthlyPerf } = trpc.analytics.getMonthlyPerformance.useQuery();

  const [isBalanceOpen, setIsBalanceOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newBalance, setNewBalance] = useState("");
  
  const createAccount = trpc.accounts.create.useMutation({
    onSuccess: () => {
      setIsBalanceOpen(false);
      setNewAccountName("");
      setNewBalance("");
      refetchAccounts();
      refetchStats();
      refetchEquity();
      toast.success("New account created and set as active!");
    }
  });

  const deleteAccount = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      setIsDeleteOpen(false);
      refetchAccounts();
      refetchStats();
      refetchEquity();
      toast.success("Account deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const setAccount = trpc.accounts.setDefault.useMutation({
    onSuccess: () => {
      refetchAccounts();
      refetchStats();
      refetchEquity();
    }
  });

  const handleSaveBalance = () => {
    if (!newAccountName || !newBalance) return;
    createAccount.mutate({ 
      name: newAccountName, 
      initialBalance: Number(newBalance),
      isDefault: true
    });
  };

  const winLossData = stats
    ? [
        { name: "Wins", value: stats.winCount, color: COLORS.profit },
        { name: "Losses", value: stats.lossCount, color: COLORS.loss },
        ...(stats.breakEvenCount > 0
          ? [{ name: "Break Even", value: stats.breakEvenCount, color: COLORS.neutral }]
          : []),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name || "Trader"}. Here's your trading overview.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {accounts && accounts.length > 0 && (
            <div className="flex items-center gap-1">
              <Select 
                value={activeAccount?.id.toString()} 
                onValueChange={(val) => setAccount.mutate({ id: Number(val) })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete '{activeAccount?.name}'? This will permanently delete all trades in this account. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => activeAccount && deleteAccount.mutate({ id: activeAccount.id })}
                      disabled={deleteAccount.isPending}
                    >
                      {deleteAccount.isPending ? "Deleting..." : "Delete Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <Dialog open={isBalanceOpen} onOpenChange={setIsBalanceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="inline-flex items-center gap-2 text-sm font-medium">
                <Plus className="h-4 w-4" />
                New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
                <DialogDescription>
                  Start fresh with a new account balance. Old trades won't affect this new account's statistics!
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="accName">Account Name</Label>
                  <Input
                    id="accName"
                    placeholder="e.g. July Restart"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="balance">Starting Balance ($)</Label>
                  <Input
                    id="balance"
                    type="number"
                    placeholder="e.g. 50"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBalanceOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveBalance} disabled={createAccount.isPending}>
                  {createAccount.isPending ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => navigate("/trades/new")}
            className="inline-flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            New Trade
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          title="Current Balance"
          value={stats ? `$${stats.currentBalance.toLocaleString()}` : "—"}
          icon={DollarSign}
          trend={stats ? (stats.netPnL >= 0 ? "positive" : "negative") : "neutral"}
          isLoading={statsLoading}
          subtitle={`Net P&L: ${stats ? (stats.netPnL >= 0 ? "+" : "") + "$" + stats.netPnL.toLocaleString() : "—"}`}
        />
        <KpiCard
          title="Win Rate"
          value={stats ? `${stats.winRate}%` : "—"}
          icon={Percent}
          trend={stats && stats.winRate >= 50 ? "positive" : "negative"}
          isLoading={statsLoading}
          subtitle={`${stats?.winCount || 0}W / ${stats?.lossCount || 0}L`}
        />
        <KpiCard
          title="Total Trades"
          value={stats ? String(stats.totalTrades) : "—"}
          icon={BarChart3}
          trend="neutral"
          isLoading={statsLoading}
          subtitle={`${stats?.openTrades || 0} open`}
        />
        <KpiCard
          title="Profit Factor"
          value={stats ? stats.profitFactor.toFixed(2) : "—"}
          icon={Target}
          trend={stats && stats.profitFactor >= 1.5 ? "positive" : stats && stats.profitFactor >= 1 ? "neutral" : "negative"}
          isLoading={statsLoading}
        />
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          title="Avg Win"
          value={stats ? `$${stats.avgWin.toLocaleString()}` : "—"}
          icon={ArrowUpRight}
          trend="positive"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Avg Loss"
          value={stats ? `$${stats.avgLoss.toLocaleString()}` : "—"}
          icon={ArrowDownRight}
          trend="negative"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Max Drawdown"
          value={stats ? `$${stats.maxDrawdown.toLocaleString()}` : "—"}
          icon={Activity}
          trend="negative"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Current Streak"
          value={stats ? `${stats.currentStreak > 0 ? "+" : ""}${stats.currentStreak}` : "—"}
          icon={Zap}
          trend={stats && stats.currentStreak > 0 ? "positive" : stats && stats.currentStreak < 0 ? "negative" : "neutral"}
          isLoading={statsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Equity Curve */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Equity Curve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {equityCurve && equityCurve.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 18%)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
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
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Balance"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBalance)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No trade data yet. Start adding trades to see your equity curve." />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Win/Loss Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              Win / Loss Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {winLossData.length > 0 && stats && stats.totalTrades > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No data available" />
              )}
            </div>
            {winLossData.length > 0 && (
              <div className="flex justify-center gap-4 text-xs">
                {winLossData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {monthlyPerf && monthlyPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 12% 18%)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
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
                    {monthlyPerf.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? COLORS.profit : COLORS.loss}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No monthly data available yet" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  isLoading,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: "positive" | "negative" | "neutral";
  isLoading: boolean;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Icon
            className={`h-4 w-4 ${
              trend === "positive"
                ? "text-green-500"
                : trend === "negative"
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          />
          {subtitle && (
            <span className="text-[10px] text-muted-foreground">{subtitle}</span>
          )}
        </div>
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">{title}</p>
          {isLoading ? (
            <div className="mt-1 h-6 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p
              className={`text-lg font-bold ${
                trend === "positive"
                  ? "text-green-500"
                  : trend === "negative"
                  ? "text-red-500"
                  : "text-foreground"
              }`}
            >
              {value}
            </p>
          )}
        </div>
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
