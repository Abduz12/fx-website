import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import {
  Users,
  BarChart3,
  Shield,
  TrendingUp,
  
  
  UserCheck,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate]);

  const { data: systemStats } = trpc.admin.getSystemStats.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: users } = trpc.admin.getUsers.useQuery(undefined, {
    enabled: isAdmin,
  });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground">
          System overview and user management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={String(systemStats?.totalUsers || 0)}
          icon={Users}
        />
        <StatCard
          title="Total Trades"
          value={String(systemStats?.totalTrades || 0)}
          icon={BarChart3}
        />
        <StatCard
          title="Admins"
          value={String(systemStats?.adminCount || 0)}
          icon={Shield}
        />
        <StatCard
          title="Active Users"
          value={String(systemStats?.totalUsers || 0)}
          icon={TrendingUp}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({users?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">User</th>
                  <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Email</th>
                  <th className="px-3 py-2 text-center font-medium">Role</th>
                  <th className="px-3 py-2 text-right font-medium">Trades</th>
                  <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Joined</th>
                  <th className="px-3 py-2 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name || ""}
                            className="h-7 w-7 rounded-full"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users className="h-3.5 w-3.5 text-primary" />
                          </div>
                        )}
                        <span className="font-medium truncate">{u.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                      {u.email || "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.role === "admin" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{u.tradeCount}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {u.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            if (
                              confirm(
                                `Change ${u.name}'s role to ${u.role === "admin" ? "user" : "admin"}?`
                              )
                            ) {
                              updateRole.mutate({
                                userId: u.id,
                                role: u.role === "admin" ? "user" : "admin",
                              });
                            }
                          }}
                        >
                          {u.role === "admin" ? (
                            <UserX className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <Shield className="h-3.5 w-3.5 mr-1" />
                          )}
                          {u.role === "admin" ? "Demote" : "Promote"}
                        </Button>
                      )}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="h-4 w-4 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
