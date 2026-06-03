import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { Role } from '@prisma/client';

import { checkRateLimit } from '@/lib/rateLimit';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.nativeEnum(Role).default(Role.SELLER),
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    // Rate limit: max 5 registrations per 15 minutes per IP
    const rateLimit = await checkRateLimit(`register:ip:${ip}`, 5, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = result.data;

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered.' },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: 'User registered successfully', user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
