import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  
  CheckCircle2,
  Brain,
  Target,
  Clock,
  DollarSign,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tradeId = parseInt(id!);

  const { data: trade, isLoading } = trpc.trade.getById.useQuery({ id: tradeId });
  const { data: psychology } = trpc.psychology.getByTradeId.useQuery({ tradeId });
  const utils = trpc.useUtils();

  const [closeData, setCloseData] = useState({
    exitPrice: "",
    result: "Win" as "Win" | "Loss" | "Break Even",
    holdingTimeMinutes: "",
  });

  const [psychData, setPsychData] = useState({
    entryReason: "",
    confidenceLevel: "5",
    emotionBefore: "Neutral" as string,
    followedPlan: true,
    mistakeMade: "",
    lessonLearned: "",
    emotionAfter: "Neutral" as string,
  });

  const closeTrade = trpc.trade.close.useMutation({
    onSuccess: () => {
      toast.success("Trade closed successfully");
      utils.trade.getById.invalidate({ id: tradeId });
    },
  });

  const deleteTrade = trpc.trade.delete.useMutation({
    onSuccess: () => {
      toast.success("Trade deleted");
      navigate("/trades");
    },
  });

  const createPsychology = trpc.psychology.create.useMutation({
    onSuccess: () => {
      toast.success("Psychology entry saved");
      utils.psychology.getByTradeId.invalidate({ tradeId });
    },
  });

  const handleCloseTrade = () => {
    if (!closeData.exitPrice) {
      toast.error("Please enter exit price");
      return;
    }

    const entry = Number(trade?.entryPrice);
    const exit = parseFloat(closeData.exitPrice);
    const lot = Number(trade?.lotSize);
    const isBuy = trade?.direction === "Buy";

    // Simplified P&L calculation
    let pnl = 0;
    if (trade?.market.includes("XAUUSD")) {
      pnl = isBuy ? (exit - entry) * lot * 100 : (entry - exit) * lot * 100;
    } else if (trade?.market.includes("JPY")) {
      pnl = isBuy ? (exit - entry) * lot * 1000 : (entry - exit) * lot * 1000;
    } else {
      pnl = isBuy ? (exit - entry) * lot * 100000 : (entry - exit) * lot * 100000;
    }

    const pnlPercent = (pnl / (entry * lot * 1000)) * 100;

    closeTrade.mutate({
      tradeId,
      exitPrice: exit,
      profitLoss: Math.round(pnl * 100) / 100,
      profitLossPercent: Math.round(pnlPercent * 10000) / 10000,
      result: closeData.result,
      holdingTimeMinutes: closeData.holdingTimeMinutes
        ? parseInt(closeData.holdingTimeMinutes)
        : undefined,
    });
  };

  const handleSavePsychology = () => {
    createPsychology.mutate({
      tradeId,
      entryReason: psychData.entryReason || undefined,
      confidenceLevel: parseInt(psychData.confidenceLevel),
      emotionBefore: psychData.emotionBefore as any,
      followedPlan: psychData.followedPlan,
      mistakeMade: psychData.mistakeMade || undefined,
      lessonLearned: psychData.lessonLearned || undefined,
      emotionAfter: psychData.emotionAfter as any,
    });
  };

  if (isLoading || !trade) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isWin = trade.result === "Win";
  const isLoss = trade.result === "Loss";

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/trades")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                {trade.market} {trade.direction}
              </h1>
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                  trade.direction === "Buy"
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {trade.direction === "Buy" ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trade.direction}
              </span>
              {trade.status === "Closed" && (
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                    isWin
                      ? "bg-green-500/10 text-green-500"
                      : isLoss
                      ? "bg-red-500/10 text-red-500"
                      : "bg-gray-500/10 text-gray-500"
                  }`}
                >
                  {trade.result}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(trade.tradeDate).toLocaleDateString()} | {trade.session} |{" "}
              {trade.strategy}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {trade.status === "Open" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Close Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Close Trade</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Exit Price</label>
                    <Input
                      type="number"
                      step="0.00001"
                      placeholder="Enter exit price"
                      value={closeData.exitPrice}
                      onChange={(e) =>
                        setCloseData((prev) => ({ ...prev, exitPrice: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Result</label>
                    <div className="flex gap-2">
                      {(["Win", "Loss", "Break Even"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setCloseData((prev) => ({ ...prev, result: r }))}
                          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                            closeData.result === r
                              ? r === "Win"
                                ? "bg-green-500/20 text-green-500 border border-green-500/30"
                                : r === "Loss"
                                ? "bg-red-500/20 text-red-500 border border-red-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                              : "border border-border text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Holding Time (minutes)
                    </label>
                    <Input
                      type="number"
                      placeholder="Optional"
                      value={closeData.holdingTimeMinutes}
                      onChange={(e) =>
                        setCloseData((prev) => ({
                          ...prev,
                          holdingTimeMinutes: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button onClick={handleCloseTrade} className="w-full">
                    Close Trade
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/trades/${trade.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-400"
            onClick={() => {
              if (confirm("Delete this trade?")) {
                deleteTrade.mutate({ id: trade.id });
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Trade Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Entry Price"
          value={Number(trade.entryPrice).toFixed(
            trade.market.includes("JPY") ? 3 : trade.market.includes("BTC") || trade.market.includes("ETH") ? 2 : 5
          )}
          icon={Target}
        />
        <StatCard
          label="P&L"
          value={trade.profitLoss ? `$${Number(trade.profitLoss).toFixed(2)}` : "Open"}
          icon={DollarSign}
          color={
            trade.profitLoss
              ? Number(trade.profitLoss) >= 0
                ? "text-green-500"
                : "text-red-500"
              : "text-muted-foreground"
          }
        />
        <StatCard label="Lot Size" value={trade.lotSize} icon={Shield} />
        <StatCard
          label="R:R Ratio"
          value={trade.riskRewardRatio ? `1:${Number(trade.riskRewardRatio).toFixed(1)}` : "—"}
          icon={Clock}
        />
      </div>

      {/* Trade Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trade Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow label="Market" value={trade.market} />
            <DetailRow label="Direction" value={trade.direction} />
            <DetailRow label="Session" value={trade.session} />
            <DetailRow label="Strategy" value={trade.strategy} />
            <DetailRow label="Trend" value={trade.trend} />
            <DetailRow label="Timeframe" value={trade.timeframe} />
            <DetailRow label="Status" value={trade.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Price Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow
              label="Entry Price"
              value={Number(trade.entryPrice).toFixed(5)}
            />
            <DetailRow
              label="Stop Loss"
              value={trade.stopLoss ? Number(trade.stopLoss).toFixed(5) : "—"}
            />
            <DetailRow
              label="Take Profit"
              value={trade.takeProfit ? Number(trade.takeProfit).toFixed(5) : "—"}
            />
            {trade.exitPrice && (
              <DetailRow label="Exit Price" value={Number(trade.exitPrice).toFixed(5)} />
            )}
            <DetailRow label="Lot Size" value={trade.lotSize} />
            <DetailRow
              label="Risk %"
              value={trade.riskPercent ? `${trade.riskPercent}%` : "—"}
            />
            <DetailRow
              label="Risk Amount"
              value={trade.riskAmount ? `$${trade.riskAmount}` : "—"}
            />
          </CardContent>
        </Card>
      </div>

      {trade.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{trade.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Psychology Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Trading Psychology
          </CardTitle>
        </CardHeader>
        <CardContent>
          {psychology ? (
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <h4 className="font-medium mb-2 text-muted-foreground">Before Trade</h4>
                <div className="space-y-1.5">
                  <DetailRow label="Entry Reason" value={psychology.entryReason || "—"} />
                  <DetailRow label="Confidence" value={`${psychology.confidenceLevel}/10`} />
                  <DetailRow label="Emotion" value={psychology.emotionBefore || "—"} />
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-muted-foreground">After Trade</h4>
                <div className="space-y-1.5">
                  <DetailRow
                    label="Followed Plan"
                    value={psychology.followedPlan ? "Yes" : "No"}
                  />
                  <DetailRow label="Mistake" value={psychology.mistakeMade || "—"} />
                  <DetailRow label="Lesson" value={psychology.lessonLearned || "—"} />
                  <DetailRow label="Emotion After" value={psychology.emotionAfter || "—"} />
                </div>
              </div>
            </div>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Brain className="h-4 w-4 mr-2" />
                  Add Psychology Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Trading Psychology Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Why did I enter this trade?
                    </label>
                    <textarea
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      rows={2}
                      value={psychData.entryReason}
                      onChange={(e) =>
                        setPsychData((prev) => ({ ...prev, entryReason: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Confidence Level (1-10)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={psychData.confidenceLevel}
                        onChange={(e) =>
                          setPsychData((prev) => ({
                            ...prev,
                            confidenceLevel: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Emotion Before
                      </label>
                      <select
                        value={psychData.emotionBefore}
                        onChange={(e) =>
                          setPsychData((prev) => ({
                            ...prev,
                            emotionBefore: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      >
                        {["Fear", "Greed", "Confidence", "Patience", "Revenge", "Neutral", "Excitement", "Anxiety"].map(
                          (e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={psychData.followedPlan}
                        onChange={(e) =>
                          setPsychData((prev) => ({
                            ...prev,
                            followedPlan: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      Did I follow my plan?
                    </label>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Mistake Made
                    </label>
                    <textarea
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      rows={2}
                      placeholder="What went wrong?"
                      value={psychData.mistakeMade}
                      onChange={(e) =>
                        setPsychData((prev) => ({ ...prev, mistakeMade: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Lesson Learned
                    </label>
                    <textarea
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      rows={2}
                      placeholder="What will you do differently?"
                      value={psychData.lessonLearned}
                      onChange={(e) =>
                        setPsychData((prev) => ({ ...prev, lessonLearned: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Emotion After Trade
                    </label>
                    <select
                      value={psychData.emotionAfter}
                      onChange={(e) =>
                        setPsychData((prev) => ({ ...prev, emotionAfter: e.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      {[
                        "Fear",
                        "Greed",
                        "Confidence",
                        "Patience",
                        "Revenge",
                        "Neutral",
                        "Excitement",
                        "Anxiety",
                        "Relief",
                        "Regret",
                      ].map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleSavePsychology} className="w-full">
                    Save Psychology Entry
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="h-4 w-4 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
