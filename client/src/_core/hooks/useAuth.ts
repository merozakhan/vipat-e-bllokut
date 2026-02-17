/**
 * Stub useAuth hook - no authentication in this deployment.
 * Kept for compatibility with DashboardLayout and other components.
 */
export function useAuth(_options?: any) {
  return {
    user: null as { name: string; email: string; role: string } | null,
    loading: false,
    error: null,
    isAuthenticated: false,
    refresh: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  };
}
