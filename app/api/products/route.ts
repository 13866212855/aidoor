import { NextRequest, NextResponse } from 'next/server';
import { getProducts, saveProduct, deleteProduct, ensureDatabase, globalDb } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant';
import { ApplianceProduct } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabase();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant') || getTenantIdFromRequest(req);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const products = await getProducts(tenantId, category, search);
    return NextResponse.json(
      { products: products || [], tenantId },
      {
        headers: {
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    console.error('API /api/products error:', err);
    return NextResponse.json({
      products: globalDb.products || [],
      tenantId: 'default',
      fallback: true
    });
  }
}

export async function POST(req: NextRequest) {
  await ensureDatabase();
  try {
    const data: ApplianceProduct = await req.json();
    if (!data.name || !data.price) {
      return NextResponse.json({ error: '商品名称和价格为必填项' }, { status: 400 });
    }

    if (!data.id) {
      data.id = 'prod-' + Date.now();
    }
    if (!data.tenant_id) {
      data.tenant_id = getTenantIdFromRequest(req);
    }
    if (data.commission_rate !== undefined) {
      data.commission_rate = Number(data.commission_rate) || 1.0;
    } else {
      data.commission_rate = 1.0;
    }

    const saved = await saveProduct(data);
    return NextResponse.json({ success: true, product: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '保存商品失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureDatabase();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const tenantId = searchParams.get('tenant') || getTenantIdFromRequest(req);

  if (!id) {
    return NextResponse.json({ error: '缺少商品ID' }, { status: 400 });
  }

  const ok = await deleteProduct(id, tenantId);
  return NextResponse.json({ success: ok });
}
