import { useState } from 'react';
import { Users, Mail, Lock, User, ArrowRight, ArrowLeft, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNav } from '@/nav';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { allDepartments, allYears } from '@/data/mockData';

export function SignUpPage() {
  const { navigate } = useNav();
  const { signIn, signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Sign up the user
    const { error: signUpError, requiresConfirmation } = await signUp(email, password, name, { department, year });
    if (signUpError) {
      setError(signUpError);
      setSubmitting(false);
      return;
    }

    if (requiresConfirmation) {
      setSubmitting(false);
      setConfirmationRequired(true);
      return;
    }

    // Immediately sign in to get a session
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }

    // Update profile with department/year
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ department, year })
        .eq('id', user.id);
      if (profileError) {
        setError(profileError.message);
        return;
      }
    }

    navigate({ name: 'dashboard' });
  };

  if (confirmationRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 px-6">
        <div className="card w-full max-w-md p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" />
          <h1 className="mt-4 font-display text-2xl font-700 text-ink-900">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">We sent a confirmation link to <strong>{email}</strong>. Confirm it first, then log in to finish setting up your academic information.</p>
          <button onClick={() => navigate({ name: 'login' })} className="btn-primary mt-6 w-full">Go to log in <ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-brand-800 to-brand-950 p-12 justify-between relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <button onClick={() => navigate({ name: 'landing' })} className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-700" strokeWidth={2.5} />
          </div>
          <span className="font-display font-700 text-lg text-white tracking-tight">ProjectMatch</span>
        </button>

        <div className="relative">
          <h2 className="font-display font-700 text-3xl text-white tracking-tight leading-tight">
            Your next team
            <br />is one profile away.
          </h2>
          <p className="text-brand-200 mt-4 leading-relaxed max-w-md">
            Create a profile, showcase your skills, and let teams discover you — or find the perfect team to join.
          </p>
        </div>

        <div className="relative space-y-3">
          {['Create your profile in 2 minutes', 'Get matched with teams that need your skills', 'Start building from day one'].map((t) => (
            <div key={t} className="flex items-center gap-2.5 text-brand-100 text-sm">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="text-xs">✓</span>
              </div>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <button onClick={() => navigate({ name: 'landing' })} className="lg:hidden flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-colors ${s <= step ? 'bg-brand-500' : 'bg-ink-200'}`}
              />
            ))}
          </div>

          <h1 className="font-display font-700 text-2xl text-ink-900 tracking-tight">
            {step === 1 ? 'Create your account' : 'Tell us about you'}
          </h1>
          <p className="text-sm text-ink-500 mt-1.5">
            {step === 1 ? 'Step 1 of 2 — Account details' : 'Step 2 of 2 — Academic info'}
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-3 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="mt-6 space-y-5">
              <div>
                <label className="label">Full name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="input pl-10" />
                </div>
              </div>
              <div>
                <label className="label">University email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" className="input pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="input pl-10" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-base">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="mt-6 space-y-5">
              <div>
                <label className="label">Department</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <select required value={department} onChange={(e) => setDepartment(e.target.value)} className="input pl-10 appearance-none">
                    <option value="">Select department</option>
                    {allDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Year</label>
                <select required value={year} onChange={(e) => setYear(e.target.value)} className="input appearance-none">
                  <option value="">Select year</option>
                  {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                  Back
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 text-base">
                  {submitting ? 'Creating…' : <>Create account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-ink-500 mt-6">
            Already have an account?{' '}
            <button onClick={() => navigate({ name: 'login' })} className="text-brand-600 font-600 hover:text-brand-700">
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
