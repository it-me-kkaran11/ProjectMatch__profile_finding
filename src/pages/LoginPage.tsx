import { useState } from 'react';
import { Users, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNav } from '@/nav';
import { useAuth } from '@/lib/auth';

export function LoginPage() {
  const { navigate } = useNav();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    navigate({ name: 'dashboard' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-ink-900 to-ink-800 p-12 justify-between relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />

        <button onClick={() => navigate({ name: 'landing' })} className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-700 text-lg text-white tracking-tight">ProjectMatch</span>
        </button>

        <div className="relative">
          <h2 className="font-display font-700 text-3xl text-white tracking-tight leading-tight">
            Find the right people.
            <br />Build the right team.
          </h2>
          <p className="text-ink-300 mt-4 leading-relaxed max-w-md">
            Join thousands of students forming teams, building projects, and discovering talent across campus.
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex -space-x-2">
            {['bg-brand-500', 'bg-accent-500', 'bg-blue-500', 'bg-rose-500'].map((c, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-ink-800`} />
            ))}
          </div>
          <p className="text-sm text-ink-400">12,000+ students building together</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <button onClick={() => navigate({ name: 'landing' })} className="lg:hidden flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>

          <h1 className="font-display font-700 text-2xl text-ink-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-ink-500 mt-1.5">Log in to your ProjectMatch account</p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-3 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-600 cursor-pointer">
                <input type="checkbox" className="rounded border-ink-300 text-brand-600 focus:ring-brand-400" />
                Remember me
              </label>
              <button type="button" className="text-brand-600 font-500 hover:text-brand-700">Forgot password?</button>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base">
              {submitting ? 'Logging in…' : <>Log in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-ink-400">or</span>
            </div>
          </div>

          <button onClick={() => navigate({ name: 'signup' })} className="btn-secondary w-full py-3">
            Create a new account
          </button>

          <p className="text-center text-sm text-ink-500 mt-6">
            Don't have an account?{' '}
            <button onClick={() => navigate({ name: 'signup' })} className="text-brand-600 font-600 hover:text-brand-700">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
