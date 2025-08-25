// src/app/api/auth/[...nextauth]/route.ts (Corrected with Google & Callbacks)
import NextAuth, { type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google'; // 1. Import Google Provider
import { PrismaAdapter } from '@auth/prisma-adapter'; 
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // 2. Add Google Provider to the array
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      async sendVerificationRequest({ identifier: email, url }) {
        await resend.emails.send({
          from: 'Alouette A11Y <onboarding@resend.dev>',
          to: email,
          subject: 'Connexion à Alouette A11Y',
          html: `<p>Cliquez sur le lien pour vous connecter : <a href="${url}">${url}</a></p>`,
        });
      },
    }),
  ],
  session: {
    strategy: 'database',
  },
  // 3. Add Callbacks to manage the session token
  callbacks: {
    async session({ session, user }) {
      // Add user ID to the session object
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id && user.email) {
        await prisma.organization.create({
          data: {
            name: `${user.name || user.email?.split('@')[0]}'s Organization`,
            userId: user.id,
          },
        });
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };