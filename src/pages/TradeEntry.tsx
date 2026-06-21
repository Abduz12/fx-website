import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  TrendingUp,
  TrendingDown,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMarketMultiplier } from "@/lib/utils";

const markets = [
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
  "ICT Smart Money Concepts",
  "Breakout Retest",
  "Supply and Demand",
  "Trend Following",
  "Scalping",
  "News Trading",
  "Other",
];
const timeframes = ["1M", "5M", "15M", "1H", "4H", "Daily"];

export default function TradeEntry() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    tradeDate: new Date().toISOString().split("T")[0],
    tradeTime: new Date().toTimeString().slice(0, 5),
    session: "London" as "Asian" | "London" | "New York",
    market: "XAUUSD" as string,
    direction: "Buy" as "Buy" | "Sell",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    lotSize: "",
    riskPercent: "",
    riskAmount: "",
    rewardAmount: "",
    riskRewardRatio: "",
    strategy: "ICT Smart Money Concepts" as string,
    trend: "Bullish" as "Bullish" | "Bearish" | "Ranging",
    timeframe: "1H" as string,
    notes: "",
    screenshots: "",
  });

  const [showCalculator, setShowCalculator] = useState(false);

  const createTrade = trpc.trade.create.useMutation({
    onSuccess: () => {
      toast.success(isEditing ? "Trade updated successfully" : "Trade created successfully");
      navigate("/trades");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entryPrice || !formData.lotSize) {
      toast.error("Please fill in all required fields");
      return;
    }

    createTrade.mutate({
      tradeDate: formData.tradeDate,
      tradeTime: formData.tradeTime,
      session: formData.session,
      market: formData.market as any,
      direction: formData.direction,
      entryPrice: parseFloat(formData.entryPrice),
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
      takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : undefined,
      lotSize: parseFloat(formData.lotSize),
      riskPercent: formData.riskPercent ? parseFloat(formData.riskPercent) : undefined,
      riskAmount: formData.riskAmount ? parseFloat(formData.riskAmount) : undefined,
      rewardAmount: formData.rewardAmount ? parseFloat(formData.rewardAmount) : undefined,
      riskRewardRatio: formData.riskRewardRatio ? parseFloat(formData.riskRewardRatio) : undefined,
      strategy: formData.strategy as any,
      trend: formData.trend,
      timeframe: formData.timeframe as any,
      notes: formData.notes || undefined,
      screenshots: formData.screenshots || undefined,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-calculate risk/reward
  const calculateRR = () => {
    const entry = parseFloat(formData.entryPrice);
    const sl = parseFloat(formData.stopLoss);
    const tp = parseFloat(formData.takeProfit);

    if (entry && sl && tp) {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      const rr = reward / risk;
      updateField("riskRewardRatio", rr.toFixed(2));

      // Estimate risk amount based on lot size and market
      const lot = parseFloat(formData.lotSize);
      if (lot) {
        const multiplier = getMarketMultiplier(formData.market);
        const riskAmount = risk * lot * multiplier;
        updateField("riskAmount", riskAmount.toFixed(2));
        const rewardAmount = reward * lot * multiplier;
        updateField("rewardAmount", rewardAmount.toFixed(2));
      }
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/trades")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Trade" : "New Trade"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Record your trade details accurately
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
                <Input
                  type="date"
                  value={formData.tradeDate}
                  onChange={(e) => updateField("tradeDate", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Time *</label>
                <Input
                  type="time"
                  value={formData.tradeTime}
                  onChange={(e) => updateField("tradeTime", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Session *</label>
                <select
                  value={formData.session}
                  onChange={(e) => updateField("session", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="Asian">Asian</option>
                  <option value="London">London</option>
                  <option value="New York">New York</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Market *</label>
                <select
                  value={formData.market}
                  onChange={(e) => updateField("market", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {markets.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="text-xs text-muted-foreground">Direction *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateField("direction", "Buy")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    formData.direction === "Buy"
                      ? "bg-green-500/20 text-green-500 border border-green-500/30"
                      : "border border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => updateField("direction", "Sell")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                    formData.direction === "Sell"
                      ? "bg-red-500/20 text-red-500 border border-red-500/30"
                      : "border border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  Sell
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Details */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Trade Details</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <Calculator className="h-3.5 w-3.5 mr-1" />
              {showCalculator ? "Hide" : "Show"} Calculator
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showCalculator && (
              <div className="rounded-md bg-accent/50 p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Quick Calculator</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Risk:</span>{" "}
                    {formData.riskAmount ? `$${formData.riskAmount}` : "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reward:</span>{" "}
                    {formData.rewardAmount ? `$${formData.rewardAmount}` : "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">R:R =</span>{" "}
                    {formData.riskRewardRatio ? formData.riskRewardRatio : "—"}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Entry Price *</label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.08500"
                  value={formData.entryPrice}
                  onChange={(e) => updateField("entryPrice", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Stop Loss</label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.08000"
                  value={formData.stopLoss}
                  onChange={(e) => updateField("stopLoss", e.target.value)}
                  onBlur={calculateRR}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Take Profit</label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="1.09500"
                  value={formData.takeProfit}
                  onChange={(e) => updateField("takeProfit", e.target.value)}
                  onBlur={calculateRR}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Lot Size *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.10"
                  value={formData.lotSize}
                  onChange={(e) => updateField("lotSize", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Risk %</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={formData.riskPercent}
                  onChange={(e) => updateField("riskPercent", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">R:R Ratio</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1:2"
                  value={formData.riskRewardRatio}
                  onChange={(e) => updateField("riskRewardRatio", e.target.value)}
                  readOnly
                  className="bg-muted/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy & Market Conditions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Strategy & Market Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Strategy *</label>
                <select
                  value={formData.strategy}
                  onChange={(e) => updateField("strategy", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {strategies.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trend *</label>
                <select
                  value={formData.trend}
                  onChange={(e) => updateField("trend", e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="Bullish">Bullish</option>
                  <option value="Bearish">Bearish</option>
                  <option value="Ranging">Ranging</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Timeframe *</label>
                <select
                  value={formData.timeframe}
                  onChange={(e) => updateField("timeframe", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {timeframes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notes & Screenshots</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Trade Notes</label>
              <Textarea
                placeholder="Add any observations, market context, or notes about this trade..."
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Screenshot URLs (comma separated)
              </label>
              <Input
                placeholder="https://example.com/chart1.png, https://example.com/chart2.png"
                value={formData.screenshots}
                onChange={(e) => updateField("screenshots", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={createTrade.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createTrade.isPending ? "Saving..." : isEditing ? "Update Trade" : "Save Trade"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/trades")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
