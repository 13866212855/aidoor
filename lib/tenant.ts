import { NextRequest } from 'next/server';

export const DEFAULT_TENANT_ID = 'default';

export function normalizeTenantId(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return DEFAULT_TENANT_ID;
  const clean = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return clean || DEFAULT_TENANT_ID;
}

export function getTenantIdFromRequest(req: NextRequest): string {
  // 1. Query 参数 (?tenant=xxx 或 ?t=xxx)
  const queryTenant = req.nextUrl.searchParams.get('tenant') || req.nextUrl.searchParams.get('t');
  if (queryTenant?.trim()) return normalizeTenantId(queryTenant);

  // 2. Request Header (x-tenant-id)
  const headerTenant = req.headers.get('x-tenant-id');
  if (headerTenant?.trim()) return normalizeTenantId(headerTenant);

  // 3. Cookie (dingcan_tenant_id 或 store_tenant_id)
  const cookieTenant = req.cookies.get('store_tenant_id')?.value || req.cookies.get('dingcan_tenant_id')?.value;
  if (cookieTenant?.trim()) return normalizeTenantId(cookieTenant);

  return DEFAULT_TENANT_ID;
}
