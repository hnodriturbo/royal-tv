// /app/api/admin/users/showUsers/route.js
// This endpoint returns a paginated list of users, excluding sensitive fields like password.
'use server';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const skip = (page - 1) * limit;

    // Count total users to compute total pages
    const totalCount = await prisma.user.count();

    // Fetch users excluding sensitive fields
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true, // Include other fields as needed
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({ users, totalPages });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    );
  }
}
