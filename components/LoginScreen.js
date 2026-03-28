export function LoginScreen({ email, password, loginError, loadingLogin, setEmail, setPassword, onLogin }) {
  return (
    <main className="auth-shell">
      <section className="auth-hero glass-card">
        <div className="eyebrow">Bimbel Pro Enterprise</div>
        <h1 className="hero-title">Upgrade Besar: multi cabang, payroll, laporan keuangan, dan UI premium.</h1>
        <p className="text-muted large">Versi ini menyiapkan operasional cabang, barcode siswa otomatis, absensi karyawan dengan barcode global pintu, serta rekap gaji dan bonus dari panel master.</p>
        <div className="pill-row">
          <span className="pill">Multi cabang</span>
          <span className="pill">Payroll guru hybrid</span>
          <span className="pill">Laporan harian-mingguan-bulanan</span>
        </div>
      </section>
      <section className="auth-panel glass-card">
        <h2 className="section-title">Login sistem</h2>
        <div className="form-row"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="master@gmail.com" /></div>
        <div className="form-row"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="123456" /></div>
        {loginError ? <div className="banner banner-warning">{loginError}</div> : null}
        <button className="btn btn-primary btn-block" onClick={onLogin} disabled={loadingLogin}>{loadingLogin ? 'Memproses...' : 'Login ke Dashboard'}</button>
        <div className="helper-box">
          <div><b>Pastikan Email dan Password yang dimasukkan sudah Benar</b></div>
          
        </div>
      </section>
    </main>
  )
}
