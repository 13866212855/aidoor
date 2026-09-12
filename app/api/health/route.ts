import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    system: '智慧电商与门店营销系统',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    skills: ['mybuysomething'],
  });
}
