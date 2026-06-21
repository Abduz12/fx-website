import { trpc } from "@/providers/trpc";
import {
  Brain,
  AlertTriangle,
  Target,
  Zap,
  Lightbulb,
  BarChart3,
  Activity,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AIAssistant() {
  const { data: analysis } = trpc.analytics.getAIAnalysis.useQuery();
  const { data: stats } = trpc.analytics.getDashboardStats.useQuery();

  if (!analysis) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI Trading Assistant
        </h1>
        <p className="text-sm text-muted-foreground">
          Personalized insights based on your trading data
        </p>
      </div>

      {!analysis.ready ? (
        <Alert className="border-yellow-500/30 bg-yellow-500/5">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle>Not Enough Data</AlertTitle>
          <AlertDescription>
            {analysis.message || "You need at least 5 closed trades for AI analysis."}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Key Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InsightCard
              title="Best Strategy"
              value={analysis.bestStrategy || "N/A"}
              subtitle={`$${analysis.bestStrategyPnL || 0} profit`}
              icon={Target}
              color="text-green-500"
              bgColor="bg-green-500/10"
            />
            <InsightCard
              title="Best Market"
              value={analysis.bestMarket || "N/A"}
              subtitle={`$${analysis.bestMarketPnL || 0} profit`}
              icon={BarChart3}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <InsightCard
              title="Best Session"
              value={analysis.bestSession || "N/A"}
              subtitle={`$${analysis.bestSessionPnL || 0} profit`}
              icon={Zap}
              color="text-yellow-500"
              bgColor="bg-yellow-500/10"
            />
          </div>

          {/* Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Personalized Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.suggestions && analysis.suggestions.length > 0 ? (
                analysis.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-md border border-border p-3 hover:bg-accent/30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Continue trading to receive personalized suggestions.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Consecutive Losses Warning */}
            {(analysis.maxConsecutiveLosses || 0) >= 3 && (
              <Alert className="border-red-500/30 bg-red-500/5 lg:col-span-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertTitle>Warning: Consecutive Losses Detected</AlertTitle>
                <AlertDescription>
                  You had {analysis.maxConsecutiveLosses} consecutive losses in your last {analysis.tradeCount} trades.
                  Consider reviewing your strategy and taking breaks after 2 consecutive losses to avoid revenge trading.
                </AlertDescription>
              </Alert>
            )}

            {/* Recent Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetricRow
                  label="Recent Win Rate"
                  value={`${analysis.recentWinRate || 0}%`}
                  trend={(analysis.recentWinRate || 0) >= 50 ? "positive" : "negative"}
                />
                <MetricRow
                  label="Max Consecutive Losses"
                  value={String(analysis.maxConsecutiveLosses || 0)}
                  trend={(analysis.maxConsecutiveLosses || 0) >= 3 ? "negative" : "neutral"}
                />
                <MetricRow
                  label="Net P&L"
                  value={`$${stats?.netPnL || 0}`}
                  trend={(stats?.netPnL || 0) >= 0 ? "positive" : "negative"}
                />
                <MetricRow
                  label="Profit Factor"
                  value={stats?.profitFactor?.toFixed(2) || "0"}
                  trend={(stats?.profitFactor || 0) >= 1.5 ? "positive" : "neutral"}
                />
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Health</span>
                    <span
                      className={`font-medium ${
                        (analysis.recentWinRate || 0) >= 50 && (stats?.profitFactor || 0) >= 1
                          ? "text-green-500"
                          : (analysis.recentWinRate || 0) >= 40
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {(analysis.recentWinRate || 0) >= 50 && (stats?.profitFactor || 0) >= 1
                        ? "Healthy"
                        : (analysis.recentWinRate || 0) >= 40
                        ? "Caution"
                        : "At Risk"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (analysis.recentWinRate || 0) >= 50 && (stats?.profitFactor || 0) >= 1
                          ? "bg-green-500"
                          : (analysis.recentWinRate || 0) >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          ((analysis.recentWinRate || 0) / 100) * (stats?.profitFactor || 1) * 50
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-md bg-accent/30 p-3 text-sm space-y-1">
                  <p className="font-medium">Recommendations:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {(analysis.recentWinRate || 0) < 50 && (
                      <li>Focus on high-probability setups only</li>
                    )}
                    {(analysis.maxConsecutiveLosses || 0) >= 3 && (
                      <li>Implement a mandatory break after 2 consecutive losses</li>
                    )}
                    {(stats?.profitFactor || 0) < 1.5 && (
                      <li>Improve your risk-reward ratio on entries</li>
                    )}
                    {(analysis.recentWinRate || 0) >= 50 && (stats?.profitFactor || 0) >= 1.5 && (
                      <li>Your performance is good. Keep following your system.</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function InsightCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`inline-flex rounded-lg ${bgColor} p-2 mb-3`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm font-bold mt-0.5 truncate">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium ${
          trend === "positive"
            ? "text-green-500"
            : trend === "negative"
            ? "text-red-500"
            : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
