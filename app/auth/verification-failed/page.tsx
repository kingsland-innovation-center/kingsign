'use client';

import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerificationFailed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verification Failed
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Unfortunately, we were unable to verify your email. This may be because the email has already been used or is invalid.
          </p>
        </div>
        <div className="mt-8">
          <p className="text-sm text-gray-500">
            Want to try verifying again?{' '}
            <Link
              href="/auth/resend-verification"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Resend Verification Email
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}