import { Routes, Route } from "react-router";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";

// Layout
const Layout = lazy(() => import("./components/Layout"));

// Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Trades = lazy(() => import("./pages/Trades"));
const TradeEntry = lazy(() => import("./pages/TradeEntry"));
const TradeDetail = lazy(() => import("./pages/TradeDetail"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Journal = lazy(() => import("./pages/Journal"));
const TradingRules = lazy(() => import("./pages/TradingRules"));
const Calculator = lazy(() => import("./pages/Calculator"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/trades/new" element={<TradeEntry />} />
            <Route path="/trades/:id" element={<TradeDetail />} />
            <Route path="/trades/:id/edit" element={<TradeEntry />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/rules" element={<TradingRules />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'hsl(220 15% 8%)',
            border: '1px solid hsl(220 12% 18%)',
            color: 'hsl(210 20% 95%)',
          },
        }}
      />
    </>
  );
}
