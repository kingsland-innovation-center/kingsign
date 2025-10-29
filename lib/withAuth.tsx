import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";
import { appPath } from "./utils";

interface WithAuthOptions {
  requireAuth?: boolean;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requireAuth = true } = options;

  return async function WithAuthComponent(props: P) {
    const session = await getServerSession(authOptions);

    if (requireAuth && !session) {
      redirect(appPath.auth.login);
    }

    if (!requireAuth && session) {
      redirect(appPath.dashboard.root);
    }

    return <WrappedComponent {...props} />;
  };
}

// Usage examples:
// For protected routes:
// export default withAuth(ProtectedPage);
// 
// For public routes (no auth required):
// export default withAuth(PublicPage, { requireAuth: false }); 