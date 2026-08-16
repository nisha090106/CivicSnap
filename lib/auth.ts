import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber } from 'better-auth/plugins';
import { jwt } from 'better-auth/plugins';
import { db } from '../db';
import * as schema from '../db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'citizen',
        required: false,
      },
      department: {
        type: 'string',
        required: false,
      },
      isApproved: {
        type: 'boolean',
        defaultValue: true,
        required: false,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    },
  },
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }, request) => {
        // Stub sendOTP function logging to console for testing
        console.log(`========================================`);
        console.log(`[BetterAuth OTP Service]`);
        console.log(`Target Phone: ${phoneNumber}`);
        console.log(`Verification Code: ${code}`);
        console.log(`========================================`);
      },
    }),
    jwt({
      jwt: {
        expirationTime: '30d',
      },
      jwks: {
        keyPairConfig: {
          alg: 'RS256',
        },
      },
    }),
  ],
});
