
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    // Only run middleware on admin routes to improve performance
    matcher: ['/admin/:path*'],
};
