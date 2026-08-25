import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Route =
  | { name: 'landing' }
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'dashboard' }
  | { name: 'discover' }
  | { name: 'student'; id: string }
  | { name: 'projects' }
  | { name: 'project'; id: string }
  | { name: 'create-project' }
  | { name: 'edit-project'; id: string }
  | { name: 'teams' }
  | { name: 'team'; id: string }
  | { name: 'profile' };

interface NavContextValue {
  route: Route;
  navigate: (route: Route) => void;
  goBack: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Route[]>([{ name: 'landing' }]);

  const navigate = useCallback((route: Route) => {
    setHistory((prev) => [...prev, route]);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const route = history[history.length - 1];

  return (
    <NavContext.Provider value={{ route, navigate, goBack }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
