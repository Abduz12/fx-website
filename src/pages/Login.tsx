import { BarChart3, TrendingUp, Shield, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";

export default function Login() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="flex-1 bg-card flex flex-col justify-center items-center p-8 lg:p-12 border-r border-border">
        <div className="max-w-md w-full space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">TradeJournal Pro</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              Professional Trading Journal
            </h2>
            <p className="text-muted-foreground">
              Track, analyze, and improve your trading performance with our comprehensive
              trading journal platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard
              icon={TrendingUp}
              title="Track Trades"
              description="Record every trade with detailed parameters"
            />
            <FeatureCard
              icon={Brain}
              title="AI Analysis"
              description="Get personalized trading insights"
            />
            <FeatureCard
              icon={Shield}
              title="Risk Management"
              description="Built-in calculators and rules"
            />
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your trading journal
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            Sign in with Kimi
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-4 space-y-2">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
