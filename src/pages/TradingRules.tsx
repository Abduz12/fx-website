import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Target,
  TrendingUp,
  AlertTriangle,
  Brain,
  Clock,
  Layout,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


const categories = [
  { value: "Risk Management", icon: AlertTriangle, color: "text-yellow-500" },
  { value: "Entry Rules", icon: Target, color: "text-blue-500" },
  { value: "Exit Rules", icon: TrendingUp, color: "text-green-500" },
  { value: "Psychology", icon: Brain, color: "text-purple-500" },
  { value: "Session", icon: Clock, color: "text-cyan-500" },
  { value: "General", icon: Layout, color: "text-gray-500" },
];

export default function TradingRules() {
  const utils = trpc.useUtils();
  const [newRule, setNewRule] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [today] = useState(new Date().toISOString().split("T")[0]);

  const { data: rules, isLoading } = trpc.rules.listRules.useQuery();
  const { data: checklist } = trpc.rules.getChecklist.useQuery({ date: today });

  const createRule = trpc.rules.createRule.useMutation({
    onSuccess: () => {
      toast.success("Rule added");
      utils.rules.listRules.invalidate();
      setNewRule("");
    },
  });

  const deleteRule = trpc.rules.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("Rule deleted");
      utils.rules.listRules.invalidate();
    },
  });

  const toggleChecklist = trpc.rules.toggleChecklist.useMutation({
    onSuccess: () => {
      utils.rules.getChecklist.invalidate({ date: today });
    },
  });

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    createRule.mutate({
      rule: newRule,
      category: newCategory as any,
    });
  };

  const isRuleCompleted = (ruleId: number) => {
    return checklist?.some((c) => c.ruleId === ruleId && c.completed) || false;
  };

  const completedCount = rules?.filter((r) => isRuleCompleted(r.id)).length || 0;
  const totalRules = rules?.length || 0;
  const progress = totalRules > 0 ? (completedCount / totalRules) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trading Rules</h1>
        <p className="text-sm text-muted-foreground">
          Define and track your personal trading rules
        </p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">Today's Checklist</p>
              <p className="text-xs text-muted-foreground">
                {completedCount} of {totalRules} rules completed
              </p>
            </div>
            <span className="text-sm font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Add Rule */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Rule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rule</label>
              <Input
                placeholder="e.g., Never risk more than 1% per trade"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleAddRule} className="w-full" disabled={createRule.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </CardContent>
        </Card>

        {/* Rules List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              My Rules ({totalRules})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : rules && rules.length > 0 ? (
              <div className="space-y-2">
                {rules.map((rule) => {
                  const category = categories.find((c) => c.value === rule.category);
                  const completed = isRuleCompleted(rule.id);
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-3 rounded-md border p-3 transition-all ${
                        completed
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <button
                        onClick={() =>
                          toggleChecklist.mutate({
                            ruleId: rule.id,
                            date: today,
                            completed: !completed,
                          })
                        }
                        className="flex-shrink-0"
                      >
                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {rule.rule}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {category && (
                            <>
                              <category.icon className={`h-3 w-3 ${category.color}`} />
                              <span className="text-[10px] text-muted-foreground">
                                {rule.category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                        onClick={() => {
                          if (confirm("Delete this rule?")) {
                            deleteRule.mutate({ id: rule.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No rules yet. Add your first trading rule above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
