// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // Custom send function for Resend
      async sendVerificationRequest({ identifier: email, url }) {
        const { data, error } = await resend.emails.send({
          from: 'Alouette A11Y <onboarding@resend.dev>',
          to: email,
          subject: 'Connexion à Alouette A11Y',
          html: `<p>Cliquez sur le lien pour vous connecter : <a href="${url}">${url}</a></p>`,
        });

        if (error) {
          throw new Error(`Email could not be sent: ${error.message}`);
        }
      },
    }),
  ],
  // Step 2: Automatically create an organization when a new user signs up
  events: {
    async createUser({ user }) {
      if (user.id && user.email) {
        await prisma.organization.create({
          data: {
            // Use the part of the email before the @ as a default name
            name: `${user.email.split('@')[0]}'s Organization`,
            userId: user.id,
          },
        });
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request', // Page to show after email is sent
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };