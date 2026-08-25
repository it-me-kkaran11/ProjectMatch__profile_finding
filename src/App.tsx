import { NavProvider, useNav } from '@/nav';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Navigation, MobileNav } from '@/components/Navigation';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { StudentProfilePage } from '@/pages/StudentProfilePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailsPage } from '@/pages/ProjectDetailsPage';
import { CreateProjectPage } from '@/pages/CreateProjectPage';
import { EditProjectPage } from '@/pages/EditProjectPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { TeamDetailsPage } from '@/pages/TeamDetailsPage';
import { MyProfilePage } from '@/pages/MyProfilePage';

const publicRoutes = ['landing', 'login', 'signup'];

function AppShell() {
  const { route, navigate } = useNav();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-700 text-lg">PM</span>
          </div>
          <p className="text-sm text-ink-400">Loading ProjectMatch…</p>
        </div>
      </div>
    );
  }

  // Redirect to login if trying to access protected route without auth
  if (!user && !publicRoutes.includes(route.name)) {
    navigate({ name: 'login' });
    return null;
  }

  // Redirect to dashboard if already logged in and visiting login/signup/landing
  if (user && publicRoutes.includes(route.name)) {
    navigate({ name: 'dashboard' });
    return null;
  }

  // Auth pages render full-screen (no nav)
  if (route.name === 'landing' || route.name === 'login' || route.name === 'signup') {
    return (
      <>
        {route.name === 'landing' && <LandingPage />}
        {route.name === 'login' && <LoginPage />}
        {route.name === 'signup' && <SignUpPage />}
      </>
    );
  }

  // Protected app pages with navigation
  return (
    <div className="flex min-h-screen bg-ink-50">
      <Navigation />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {route.name === 'dashboard' && <DashboardPage />}
        {route.name === 'discover' && <DiscoverPage />}
        {route.name === 'student' && <StudentProfilePage id={route.id} />}
        {route.name === 'projects' && <ProjectsPage />}
        {route.name === 'project' && <ProjectDetailsPage id={route.id} />}
        {route.name === 'create-project' && <CreateProjectPage />}
        {route.name === 'edit-project' && <EditProjectPage id={route.id} />}
        {route.name === 'teams' && <TeamsPage />}
        {route.name === 'team' && <TeamDetailsPage id={route.id} />}
        {route.name === 'profile' && <MyProfilePage />}
      </main>
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NavProvider>
        <AppShell />
      </NavProvider>
    </AuthProvider>
  );
}

export default App;
