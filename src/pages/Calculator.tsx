import { useState, useEffect } from "react";
import { Calculator as CalcIcon, TrendingUp, TrendingDown, DollarSign, Percent, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";

export default function Calculator() {
  const { data: stats } = trpc.analytics.getDashboardStats.useQuery();
  
  const [accountSize, setAccountSize] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("1");
  const [stopLossPips, setStopLossPips] = useState("50");
  const [pipValue, setPipValue] = useState("10");

  useEffect(() => {
    if (stats?.currentBalance) {
      setAccountSize(String(stats.currentBalance));
    }
  }, [stats?.currentBalance]);

  const [results, setResults] = useState({
    riskAmount: 0,
    lotSize: 0,
  });

  useEffect(() => {
    calculate();
  }, [accountSize, riskPercent, stopLossPips, pipValue]);

  const calculate = () => {
    const account = parseFloat(accountSize) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const pips = parseFloat(stopLossPips) || 0;
    const pipVal = parseFloat(pipValue) || 0;

    const riskAmount = account * (risk / 100);

    // Lot size calculation: Lot Size = Risk Amount / (Stop Loss Pips * Pip Value per standard lot)
    const lotSize = pips > 0 && pipVal > 0 ? riskAmount / (pips * pipVal) : 0;

    setResults({
      riskAmount: Math.round(riskAmount * 100) / 100,
      lotSize: Math.round(lotSize * 1000) / 1000,
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
                  Stop Loss (Pips/Points)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(e.target.value)}
                  placeholder="50"
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
              value={results.lotSize.toFixed(3)}
              subtitle="Recommended position size"
              color="text-blue-500"
            />


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
