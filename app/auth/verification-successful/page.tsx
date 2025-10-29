'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function VerificationSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email verified successfully!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your email has been verified. You can now log in to your account.
          </p>
        </div>
        <div className="mt-8">
          <p className="text-sm text-gray-500">
            Ready to get started?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 