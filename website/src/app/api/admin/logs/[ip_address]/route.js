import prisma from '@/lib/core/prisma';
import { NextResponse } from 'next/server';
import { withRole } from '@/lib/api/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRole('admin', async (_req, ctx) => {
  const ip_address = decodeURIComponent(ctx.params.ip_address || '');
  if (!ip_address) return NextResponse.json({ error: 'Missing IP address.' }, { status: 400 });

  const logs = await prisma.log.findMany({ where: { ip_address }, include: { user: true } });
  return NextResponse.json({ logs });
});

export const DELETE = withRole('admin', async (_req, ctx) => {
  const ip_address = decodeURIComponent(ctx.params.ip_address || '');
  if (!ip_address) return NextResponse.json({ error: 'Missing IP address.' }, { status: 400 });

  await prisma.log.deleteMany({ where: { ip_address } });
  return NextResponse.json({ success: true });
});
