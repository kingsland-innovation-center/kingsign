import Image from 'next/image';
import { LoginForm } from './login-form';
import { withAuth } from '@/lib/withAuth';

function LoginPage() {
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
          <h1 className="text-2xl font-semibold mb-8">Login</h1>
          <LoginForm />
        </div>
      </div>

      <div className="hidden w-1/2 md:block"></div>
    </div>
  );
}

export default withAuth(LoginPage, { requireAuth: false });

