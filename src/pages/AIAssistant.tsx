import { trpc } from "@/providers/trpc";
import { useState, useRef, useEffect } from "react";
import {
  Brain,
  AlertTriangle,
  Target,
  Zap,
  BarChart3,
  Activity,
  Shield,
  Send,
  User,
  Bot,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Message = { role: "user" | "model"; content: string };

export default function AIAssistant() {
  const { data: analysis } = trpc.analytics.getAIAnalysis.useQuery();
  const { data: stats } = trpc.analytics.getDashboardStats.useQuery();
  const chatMutation = trpc.analytics.chatWithAI.useMutation();

  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Hello! I am your AI Trading Coach. I have reviewed your trading history. How can I help you improve your trading today?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!analysis) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const result = await chatMutation.mutateAsync({
        message: userMessage.content,
        history: messages.slice(1), // Exclude the initial greeting
      });

      setMessages((prev) => [
        ...prev,
        { role: "model", content: result.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Sorry, I encountered an error connecting to the AI. Please try again." },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI Trading Assistant
        </h1>
        <p className="text-sm text-muted-foreground">
          Your personal AI trading coach powered by Gemini Pro
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column: Chat Interface */}
          <Card className="xl:col-span-2 flex flex-col h-[700px]">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Chat with Trading Coach
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className={`flex-shrink-0 rounded-full p-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded-full p-2 bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-4 py-3 bg-muted/50 text-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <CardFooter className="pt-3 border-t border-border/50">
              <form
                className="flex w-full items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <Input
                  placeholder="Ask for trade suggestions, strategy advice, etc..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={chatMutation.isPending}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!input.trim() || chatMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>

          {/* Right Column: Key Insights & Performance */}
          <div className="space-y-6">
            {/* Key Insights */}
            <div className="grid grid-cols-2 gap-3">
              <InsightCard
                title="Best Strategy"
                value={analysis.bestStrategy || "N/A"}
                subtitle={`$${analysis.bestStrategyPnL || 0} profit`}
                icon={Target}
                color="text-green-500"
                bgColor="bg-green-500/10"
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

            {/* Performance Stats */}
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
                  label="Max Consec. Losses"
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

                <div className="rounded-md bg-accent/30 p-3 text-sm space-y-1 mt-4">
                  <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-2">Coach's Advice</p>
                  <p className="text-sm">
                    Use the chat interface to ask me questions about your trading performance, risk management, or specific setups!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
