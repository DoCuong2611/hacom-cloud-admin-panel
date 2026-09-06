import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { authClient } from '@/api/clients/authClient/authClient';
import { router } from '@/app/router/router';
import { AppProviders } from '@/app/providers/AppProviders/AppProviders';
import { useAuthStore } from '@/store/authStore/authStore';

const App = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    let active = true;

    // There is no reason to call Auth refresh on a first visit. The access token
    // is intentionally not persisted; these markers only indicate that a
    // previous login established a browser session worth refreshing.
    const hasPersistedSession =
      typeof window !== 'undefined' &&
      (window.localStorage.getItem('chat-admin-auth') !== null ||
        window.sessionStorage.getItem('chat-admin-session-v2') !== null);

    if (!hasPersistedSession) {
      setInitialized(true);
      return () => {
        active = false;
      };
    }

    void authClient
      .refresh()
      .then((session) => {
        if (active) setAuth({ accessToken: session.accessToken, user: session.user ?? null });
      })
      .catch(() => {
        if (active) clearAuth();
      })
      .finally(() => {
        if (active) setInitialized(true);
      });

    return () => {
      active = false;
    };
  }, [clearAuth, setAuth, setInitialized]);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};

export default App;
