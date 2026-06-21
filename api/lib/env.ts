import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  return value ?? "dummy_value";
}

export const env = {
  appId: process.env.APP_ID || "dummy",
  appSecret: process.env.APP_SECRET || "fallback_secret_do_not_use_in_prod",
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "",
  kimiAuthUrl: process.env.KIMI_AUTH_URL || "",
  kimiOpenUrl: process.env.KIMI_OPEN_URL || "",
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
