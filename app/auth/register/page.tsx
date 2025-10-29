import Image from 'next/image';

import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center md:flex-row bg-gradient-to-r from-[#F3FAFF] via-[#F3FAFF] to-[#1D3461]">
      <div className="w-full md:w-1/2 p-8 md:p-10 lg:p-12">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <Image
              src="/kingsland-logo.png"
              alt="Kingsland Logo"
              width={80}
              height={80}
            />
          </div>
          <h1 className="text-2xl font-semibold mb-8">Create account</h1>
          <RegisterForm />
        </div>
      </div>

      <div className="hidden w-1/2 md:block"></div>
    </div>
  );
}
