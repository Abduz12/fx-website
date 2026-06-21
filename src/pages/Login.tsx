import { BarChart3, TrendingUp, Shield, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function Login() {
  const { isAuthenticated, refresh } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Successfully logged in!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log in");
    }
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Account created successfully!");
      loginMutation.mutate({ email, password });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register");
    }
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      registerMutation.mutate({ email, password, name });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

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
            <h1 className="text-2xl font-bold">
              {isRegistering ? "Create an account" : "Welcome Back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRegistering ? "Enter your details below to create your account" : "Sign in to access your trading journal"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Please wait..." : isRegistering ? "Create account" : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm">
            {isRegistering ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="underline font-medium hover:text-primary"
            >
              {isRegistering ? "Sign in" : "Sign up"}
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
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
