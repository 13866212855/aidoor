import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateUser,
  getAllUsers,
  updateUserPoints,
  updateUserRole,
  adjustUserCommissionPoints,
  transferCommissionPoints,
  getTransferRecords,
  saveUser,
  ensureDatabase,
  globalDb,
} from '@/lib/db';
import { getTenantIdFromRequest } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabase();
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const action = searchParams.get('action');
    const tenantId = searchParams.get('tenant') || getTenantIdFromRequest(req);

    if (action === 'transfers') {
      const records = await getTransferRecords(tenantId);
      return NextResponse.json({ transfers: records || [] });
    }

    if (phone) {
      const user = await getOrCreateUser(tenantId, phone);
      return NextResponse.json({ user });
    }

    const users = await getAllUsers(tenantId);
    return NextResponse.json({ users: users || [] });
  } catch (err) {
    console.error('API /api/users error:', err);
    return NextResponse.json({ users: globalDb.users || [], fallback: true });
  }
}

export async function POST(req: NextRequest) {
  await ensureDatabase();
  try {
    const body = await req.json();
    const tId = body.tenantId || getTenantIdFromRequest(req);
    const action = body.action;

    // 1. 变更成员角色 (推广合伙人/金牌合伙人/普通会员)
    if (action === 'update_role') {
      const { phone, role } = body;
      if (!phone || !role) {
        return NextResponse.json({ error: '手机号和角色不能为空' }, { status: 400 });
      }
      const updated = await updateUserRole(tId, phone, role);
      return NextResponse.json({ success: true, user: updated });
    }

    // 2. 调整佣金积分
    if (action === 'adjust_commission') {
      const { phone, delta, note } = body;
      if (!phone || typeof delta !== 'number') {
        return NextResponse.json({ error: '手机号和变动积分值无效' }, { status: 400 });
      }
      const updated = await adjustUserCommissionPoints(tId, phone, delta, note || '');
      return NextResponse.json({ success: true, user: updated });
    }

    // 3. 积分转赠
    if (action === 'transfer_points') {
      const { fromPhone, toPhone, points, note } = body;
      if (!fromPhone || !toPhone || !points) {
        return NextResponse.json({ error: '请填写转出人、接收人及转出积分' }, { status: 400 });
      }
      const result = await transferCommissionPoints(tId, fromPhone, toPhone, Number(points), note || '');
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // 4. 保存编辑完整会员信息
    if (action === 'save_user') {
      const { user } = body;
      if (!user || !user.phone) {
        return NextResponse.json({ error: '会员资料不完整' }, { status: 400 });
      }
      const saved = await saveUser(user);
      return NextResponse.json({ success: true, user: saved });
    }

    // 5. 传统积分与消费累计更新
    const { phone, name, addPoints, addSpend, usedPoints } = body;
    if (!phone) {
      return NextResponse.json({ error: '手机号必填' }, { status: 400 });
    }
    const updated = await updateUserPoints(tId, phone, name || '', Number(addPoints) || 0, Number(addSpend) || 0, Number(usedPoints) || 0);
    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '会员更新失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
