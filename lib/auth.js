import { supabase } from './supabase'

export async function loginWithRpc(email, password) {
  const { data, error } = await supabase.rpc('app_login', {
    p_email: email.trim().toLowerCase(),
    p_password: password.trim(),
  })
  if (error) throw error
  const user = Array.isArray(data) ? data[0] : data
  if (!user) throw new Error('Email atau password salah.')
  return user
}
