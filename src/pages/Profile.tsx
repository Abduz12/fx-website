import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  User,
  Mail,
  Shield,
  BarChart3,
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Profile() {
  const { user } = useAuth();
  const { data: stats } = trpc.analytics.getDashboardStats.useQuery();
  const { data: monthlyPerf } = trpc.analytics.getMonthlyPerformance.useQuery();

  const bestMonth = monthlyPerf
    ? monthlyPerf.reduce((a, b) => (a.pnl > b.pnl ? a : b), { month: "", pnl: -Infinity })
    : null;
  const worstMonth = monthlyPerf
    ? monthlyPerf.reduce((a, b) => (a.pnl < b.pnl ? a : b), { month: "", pnl: Infinity })
    : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account and trading statistics</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name || ""} className="h-20 w-20 rounded-full" />
              ) : (
                <User className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold">{user?.name || "Trader"}</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {user?.role || "user"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Member since{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Trading Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatItem
              label="Total Trades"
              value={stats?.totalTrades || 0}
              icon={Target}
            />
            <StatItem
              label="Win Rate"
              value={`${stats?.winRate || 0}%`}
              icon={TrendingUp}
              color={stats && stats.winRate >= 50 ? "text-green-500" : "text-red-500"}
            />
            <StatItem
              label="Net P&L"
              value={`$${stats?.netPnL || 0}`}
              icon={stats && stats.netPnL >= 0 ? TrendingUp : TrendingDown}
              color={stats && stats.netPnL >= 0 ? "text-green-500" : "text-red-500"}
            />
            <StatItem
              label="Profit Factor"
              value={stats?.profitFactor?.toFixed(2) || "0"}
              icon={Award}
              color={stats && stats.profitFactor >= 1.5 ? "text-green-500" : stats && stats.profitFactor >= 1 ? "text-yellow-500" : "text-red-500"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Monthly Highlights */}
      {monthlyPerf && monthlyPerf.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monthly Highlights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestMonth && bestMonth.pnl > -Infinity && (
              <div className="flex items-center justify-between rounded-md bg-green-500/10 border border-green-500/20 p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Best Month</p>
                    <p className="text-xs text-muted-foreground">{bestMonth.month}</p>
                  </div>
                </div>
                <span className="text-green-500 font-bold">+${bestMonth.pnl.toFixed(0)}</span>
              </div>
            )}
            {worstMonth && worstMonth.pnl < Infinity && (
              <div className="flex items-center justify-between rounded-md bg-red-500/10 border border-red-500/20 p-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Worst Month</p>
                    <p className="text-xs text-muted-foreground">{worstMonth.month}</p>
                  </div>
                </div>
                <span className="text-red-500 font-bold">${worstMonth.pnl.toFixed(0)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatItem({
  label,
  value,
  icon: Icon,
  color = "text-foreground",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
