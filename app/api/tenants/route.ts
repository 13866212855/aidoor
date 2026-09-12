import { NextRequest, NextResponse } from 'next/server';
import { getAllTenants, getTenantById, saveTenant, deleteTenant, ensureDatabase, globalDb } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tenantParam = searchParams.get('tenant');

    if (id) {
      const tenant = await getTenantById(id);
      if (!tenant) {
        return NextResponse.json({ error: '门店不存在' }, { status: 404 });
      }
      return NextResponse.json(tenant);
    }

    // 若指定了子租户，只返回该子租户本身，子租户无法看到上一级 (default / /)
    const accessibleTenantId = (tenantParam && tenantParam !== 'all') ? tenantParam : undefined;
    const tenants = await getAllTenants(accessibleTenantId);
    const currentTenantId = accessibleTenantId || getTenantIdFromRequest(req);

    return NextResponse.json({
      tenants: tenants || [],
      currentTenantId,
    });
  } catch (err) {
    console.error('API /api/tenants error:', err);
    return NextResponse.json({
      tenants: globalDb.tenants || [],
      currentTenantId: 'default',
      fallback: true
    });
  }
}

export async function POST(req: NextRequest) {
  await ensureDatabase();
  try {
    const data = await req.json();
    if (!data.id || !data.name) {
      return NextResponse.json({ error: '门店编号和名称不能为空' }, { status: 400 });
    }

    const saved = await saveTenant(data);
    return NextResponse.json({ success: true, tenant: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '保存失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureDatabase();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: '缺少门店 ID' }, { status: 400 });
  }
  if (id === 'default') {
    return NextResponse.json({ error: '默认主店不能删除' }, { status: 403 });
  }
  const ok = await deleteTenant(id);
  return NextResponse.json({ success: ok });
}
