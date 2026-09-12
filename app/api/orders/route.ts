import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder, updateOrderStatus, ensureDatabase, globalDb } from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabase();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant') || getTenantIdFromRequest(req);
    const orders = await getOrders(tenantId);
    return NextResponse.json({ orders: orders || [] });
  } catch (err) {
    console.error('API /api/orders error:', err);
    return NextResponse.json({ orders: globalDb.orders || [], fallback: true });
  }
}

export async function POST(req: NextRequest) {
  await ensureDatabase();
  try {
    const body = await req.json();
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: '订单购物车不能为空' }, { status: 400 });
    }
    if (!body.delivery_phone || !body.delivery_contact) {
      return NextResponse.json({ error: '联系人和手机号为必填' }, { status: 400 });
    }

    const tenantId = body.tenant_id || getTenantIdFromRequest(req);
    const orderNo = 'JD' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);

    const created = await createOrder({
      tenant_id: tenantId,
      order_no: orderNo,
      order_type: body.order_type || '送装到家',
      delivery_address: body.delivery_address || '',
      delivery_contact: body.delivery_contact,
      delivery_phone: body.delivery_phone,
      pickup_time: body.pickup_time || '',
      total_price: Number(body.total_price) || 0,
      status: '待处理',
      payment_status: body.payment_status || '已付款',
      payment_timing: body.payment_timing || '线上付款',
      payment_proof_url: body.payment_proof_url || '',
      points_used: Number(body.points_used) || 0,
      discount_amount: Number(body.discount_amount) || 0,
      promoter_id: body.promoter_id || '',
      promoter_name: body.promoter_name || '',
      user_id: body.user_id || 'user-' + body.delivery_phone,
      items: body.items,
      remarks: body.remarks || '',
    });

    return NextResponse.json({ success: true, order: created });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '下单失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await ensureDatabase();
  try {
    const { orderId, status, paymentStatus } = await req.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: '缺少订单ID或状态' }, { status: 400 });
    }
    const success = await updateOrderStatus(orderId, status, paymentStatus);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '更新状态失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
