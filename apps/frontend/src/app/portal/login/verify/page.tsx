'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function VerifyPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Missing token');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/magic-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (!res.ok) throw new Error('Invalid token');

                const data = await res.json();
                // Save token
                localStorage.setItem('portal_token', data.access_token);
                // Redirect to dashboard
                router.push('/portal/dashboard');
            } catch (err) {
                setError('Verification failed. The link may have expired.');
            }
        };

        verify();
    }, [token, router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-600">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Error</h1>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center animate-pulse">
                <h2 className="text-xl font-medium text-gray-700">Verifying access...</h2>
            </div>
        </div>
    );
}
