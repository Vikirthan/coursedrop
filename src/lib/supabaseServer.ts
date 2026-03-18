import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient:
  | {
      url: string;
      serviceRoleKey: string;
      client: SupabaseClient;
    }
  | null = null;

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function inferSupabaseUrlFromServiceRoleKey(serviceRoleKey: string): string {
  try {
    const parts = serviceRoleKey.split(".");
    if (parts.length < 2) {
      return "";
    }

    const payloadRaw = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadRaw) as { ref?: unknown };
    const ref = typeof payload.ref === "string" ? payload.ref.trim() : "";

    if (!ref) {
      return "";
    }

    return `https://${ref}.supabase.co`;
  } catch {
    return "";
  }
}

function getSupabaseRuntimeConfig(): {
  supabaseUrl: string;
  serviceRoleKey: string;
  missing: string[];
} {
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const explicitUrl = (
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  ).trim();
  const inferredUrl = serviceRoleKey
    ? inferSupabaseUrlFromServiceRoleKey(serviceRoleKey)
    : "";
  const supabaseUrl = explicitUrl || inferredUrl;

  const missing: string[] = [];
  if (!serviceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!supabaseUrl) {
    missing.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  }

  return { supabaseUrl, serviceRoleKey, missing };
}

export function getSupabaseAdminClient(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey, missing } = getSupabaseRuntimeConfig();

  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase configuration: ${missing.join(
        ", "
      )}. Set these in your hosting dashboard and redeploy.`
    );
  }

  if (
    !cachedClient ||
    cachedClient.url !== supabaseUrl ||
    cachedClient.serviceRoleKey !== serviceRoleKey
  ) {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    cachedClient = {
      url: supabaseUrl,
      serviceRoleKey,
      client,
    };
  }

  return cachedClient.client;
}
