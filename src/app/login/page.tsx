
'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-black">
            <div className="w-full max-w-md p-8 bg-neutral-900 rounded-lg shadow-xl border border-neutral-800">
                <h1 className="text-2xl font-bold mb-6 text-white text-center">Admin Login</h1>
                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <div
                        className="flex h-8 items-end space-x-1"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {errorMessage && (
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        aria-disabled={isPending}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
