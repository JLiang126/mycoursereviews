import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

import { db } from '@/db';
import { users } from '@/db/schema';

declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: 'admin' | 'user';
        };
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: process.env.NEXT_PUBLIC_LOCAL_KEYCLOAK_URL
                ? `${process.env.NEXT_PUBLIC_LOCAL_KEYCLOAK_URL}/realms/cs-club`
                : process.env.KEYCLOAK_ISSUER!,
            ...(process.env.NEXT_PUBLIC_CONTAINER_KEYCLOAK_ENDPOINT && process.env.NEXT_PUBLIC_LOCAL_KEYCLOAK_URL
                ? {
                      jwks_endpoint: `${process.env.NEXT_PUBLIC_CONTAINER_KEYCLOAK_ENDPOINT}/realms/cs-club/protocol/openid-connect/certs`,
                      wellKnown: undefined,
                      authorization: {
                          params: {
                              scope: 'openid email profile',
                          },
                          url: `${process.env.NEXT_PUBLIC_LOCAL_KEYCLOAK_URL}/realms/cs-club/protocol/openid-connect/auth`,
                      },
                      token: `${process.env.NEXT_PUBLIC_CONTAINER_KEYCLOAK_ENDPOINT}/realms/cs-club/protocol/openid-connect/token`,
                      userinfo: `${process.env.NEXT_PUBLIC_CONTAINER_KEYCLOAK_ENDPOINT}/realms/cs-club/protocol/openid-connect/userinfo`,
                  }
                : {
                      authorization: {
                          params: {
                              scope: 'openid email profile',
                          },
                      },
                  }),
        }),
    ],
    trustHost: true,
    callbacks: {
        async signIn({ user, profile }) {
            if (!user.id || !user.email) return false;

            // Resolve and map standard CS Club roles to local DB roles
            const realmAccess = (profile as any)?.realm_access;
            const roles = realmAccess?.roles || [];
            const role = roles.includes('committee') ? 'admin' : 'user';

            // Upsert Keycloak identity info into our local PostgreSQL database
            try {
                await db.insert(users)
                    .values({
                        id: user.id,
                        name: user.name || 'Adelaide Student',
                        email: user.email,
                        image: user.image,
                        role: role,
                    })
                    .onConflictDoUpdate({
                        target: users.id,
                        set: {
                            name: user.name || 'Adelaide Student',
                            email: user.email,
                            image: user.image,
                            role: role,
                        },
                    });
                return true;
            } catch (error) {
                console.error('Error syncing user on signIn:', error);
                return false;
            }
        },
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.accessToken = account.access_token;
                token.sub = profile.sub ?? undefined;
                const realmAccess = (profile as any)?.realm_access;
                token.roles = realmAccess?.roles || [];
            }
            return token;
        },
        async session({ session, token }) {
            if (token.accessToken) {
                session.accessToken = token.accessToken as string;
            }
            if (token.sub) {
                session.user.id = token.sub as string;
            }
            // Map committee members to admin role for moderation page access
            session.user.role = (token.roles as string[])?.includes('committee') ? 'admin' : 'user';
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
});
