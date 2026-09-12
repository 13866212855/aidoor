import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (username === 'admin' && password === 'admin123') {
      const response = NextResponse.json({
        success: true,
        user: { username: 'admin', role: 'superadmin' },
      });
      // 写入 httpOnly cookie 作为管理员身份标识
      response.cookies.set({
        name: 'store_admin_token',
        value: 'super_admin_authenticated',
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7天
        sameSite: 'lax',
      });
      return response;
    }
    return NextResponse.json({ error: '账号或密码不正确' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: '登录处理失败' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('store_admin_token')?.value;
  if (token === 'super_admin_authenticated') {
    return NextResponse.json({ authenticated: true, username: 'admin' });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('store_admin_token');
  return response;
}
