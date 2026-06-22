import { useState, useEffect } from "react";
import { Calculator as CalcIcon, TrendingUp, TrendingDown, DollarSign, Percent, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";

export default function Calculator() {
  const { data: stats } = trpc.analytics.getDashboardStats.useQuery();
  
  const [accountSize, setAccountSize] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("1");
  const [stopLoss, setStopLoss] = useState("50");
  const [entryPrice, setEntryPrice] = useState("2000");
  const [takeProfit, setTakeProfit] = useState("2100");
  const [pipValue, setPipValue] = useState("10");

  useEffect(() => {
    if (stats?.currentBalance) {
      setAccountSize(String(stats.currentBalance));
    }
  }, [stats?.currentBalance]);

  const [results, setResults] = useState({
    riskAmount: 0,
    lotSize: 0,
    potentialProfit: 0,
    riskReward: 0,
    rewardAmount: 0,
  });

  useEffect(() => {
    calculate();
  }, [accountSize, riskPercent, stopLoss, entryPrice, takeProfit, pipValue]);

  const calculate = () => {
    const account = parseFloat(accountSize) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const tp = parseFloat(takeProfit) || 0;
    const pip = parseFloat(pipValue) || 0;

    const riskAmount = account * (risk / 100);
    const slDistance = Math.abs(entry - sl);
    const tpDistance = Math.abs(tp - entry);

    // Lot size calculation using Pip Value for ultimate broker compatibility
    const lotSize = slDistance > 0 && pip > 0 ? riskAmount / (slDistance * pip) : 0;
    const rewardAmount = tpDistance * lotSize * pip;
    const riskReward = slDistance > 0 ? tpDistance / slDistance : 0;

    setResults({
      riskAmount: Math.round(riskAmount * 100) / 100,
      lotSize: Math.round(lotSize * 10000) / 10000,
      potentialProfit: Math.round(rewardAmount * 100) / 100,
      riskReward: Math.round(riskReward * 100) / 100,
      rewardAmount: Math.round(rewardAmount * 100) / 100,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Risk Calculator</h1>
        <p className="text-sm text-muted-foreground">
          Calculate position size and risk/reward before entering a trade
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Inputs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalcIcon className="h-4 w-4" />
              Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Account Size
                </label>
                <Input
                  type="number"
                  value={accountSize}
                  onChange={(e) => setAccountSize(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Risk %
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Stop Loss
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="Entry - 50 pips"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Entry Price
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="2000"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Take Profit
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder="2100"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Pip Value ($)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={pipValue}
                  onChange={(e) => setPipValue(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResultCard
              label="Risk Amount"
              value={`$${results.riskAmount.toLocaleString()}`}
              subtitle={`${riskPercent}% of account`}
              color="text-red-500"
            />
            <ResultCard
              label="Lot Size"
              value={results.lotSize.toFixed(2)}
              subtitle="Recommended position size"
              color="text-blue-500"
            />
            <ResultCard
              label="Potential Profit"
              value={`$${results.potentialProfit.toLocaleString()}`}
              subtitle="If take profit is hit"
              color="text-green-500"
            />
            <ResultCard
              label="Risk : Reward"
              value={`1 : ${results.riskReward.toFixed(1)}`}
              subtitle={results.riskReward >= 2 ? "Excellent R:R" : results.riskReward >= 1.5 ? "Good R:R" : "Poor R:R - consider better setup"}
              color={results.riskReward >= 2 ? "text-green-500" : results.riskReward >= 1.5 ? "text-yellow-500" : "text-red-500"}
            />

            {/* Visual R:R Bar */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-4 rounded-full bg-red-500/20 overflow-hidden flex">
                  <div
                    className="h-full bg-red-500 rounded-l-full"
                    style={{ width: `${100 / (1 + results.riskReward)}%` }}
                  />
                  <div
                    className="h-full bg-green-500 rounded-r-full"
                    style={{ width: `${(100 * results.riskReward) / (1 + results.riskReward)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>Risk: ${results.riskAmount}</span>
                <span>Reward: ${results.rewardAmount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { risk: "0.5%", type: "Conservative" },
              { risk: "1%", type: "Standard" },
              { risk: "2%", type: "Aggressive" },
              { risk: "3%+", type: "Dangerous" },
            ].map((item) => (
              <div
                key={item.risk}
                className="rounded-md border border-border p-3"
              >
                <p className="text-lg font-bold">{item.risk}</p>
                <p className="text-xs text-muted-foreground">{item.type}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="rounded-md bg-accent/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}
