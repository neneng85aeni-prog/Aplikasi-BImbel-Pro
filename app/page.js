'use client'

import { Dashboard } from '../components/Dashboard'
import { LoginScreen } from '../components/LoginScreen'
import { useBimbelApp } from '../hooks/useBimbelApp'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Page() {
  const { state, actions } = useBimbelApp()

  if (!isSupabaseConfigured) {
    return <main className="auth-shell"><section className="glass-card"><h1 className="hero-title">Isi .env.local terlebih dahulu</h1><p className="text-muted">Aplikasi membutuhkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.</p></section></main>
  }

  if (!state.user) {
    return <LoginScreen email={state.email} password={state.password} loginError={state.loginError} loadingLogin={state.loadingLogin} setEmail={actions.setEmail} setPassword={actions.setPassword} onLogin={actions.login} />
  }

  return <Dashboard state={state} actions={actions} />
}
