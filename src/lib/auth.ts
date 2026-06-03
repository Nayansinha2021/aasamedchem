import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import * as bcrypt from 'bcrypt';
import { checkRateLimit } from './rateLimit';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const email = credentials.email.toLowerCase().trim();
        const ip = (req as any)?.headers?.['x-forwarded-for'] || (req as any)?.headers?.['x-real-ip'] || '127.0.0.1';

        // 1. Rate limit by Email (max 5 login attempts per 1 minute)
        const emailLimit = await checkRateLimit(`login:email:${email}`, 5, 60000);
        if (!emailLimit.success) {
          throw new Error('Too many login attempts on this account. Please wait a minute and try again.');
        }

        // 2. Rate limit by IP (max 15 login attempts per 1 minute)
        const ipLimit = await checkRateLimit(`login:ip:${ip}`, 15, 60000);
        if (!ipLimit.success) {
          throw new Error('Too many login attempts from this network. Please wait a minute and try again.');
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
