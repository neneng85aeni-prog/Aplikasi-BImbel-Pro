import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export function LoginScreen({ email, password, loginError, loadingLogin, setEmail, setPassword, onLogin }) {
  const [mode, setMode] = useState('orangtua')
  const [barcodeSiswa, setBarcodeSiswa] = useState('')
  const [scanBarcodeAktif, setScanBarcodeAktif] = useState(false)
  const loginScannerRef = useRef(null)

  const masukDenganBarcodeSiswa = (value) => {
    const kode = String(value || '').trim()
    if (!kode || loadingLogin) return

    setBarcodeSiswa(kode)
    setScanBarcodeAktif(false)
    onLogin(kode, 'barcode_siswa')
  }

  useEffect(() => {
    if (!scanBarcodeAktif) return undefined

    const scanner = new Html5QrcodeScanner(
      'reader-login-siswa',
      {
        qrbox: { width: 240, height: 240 },
        fps: 6,
        rememberLastUsedCamera: true,
      },
      false
    )

    loginScannerRef.current = scanner

    scanner.render(
      (decodedText) => masukDenganBarcodeSiswa(decodedText),
      () => {}
    )

    return () => {
      scanner.clear().catch(() => {})
      loginScannerRef.current = null
    }
  }, [scanBarcodeAktif])

  return (
    <main className="login-modern-shell">
      <style>{`
        .login-modern-shell {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          box-sizing: border-box;
          background:
            radial-gradient(circle at top left, rgba(59,130,246,0.22), transparent 32%),
            radial-gradient(circle at bottom right, rgba(16,185,129,0.20), transparent 34%),
            linear-gradient(135deg, #020617 0%, #0f172a 42%, #111827 100%);
          color: #f8fafc;
        }

        .login-modern-wrap {
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 22px;
          align-items: stretch;
        }

        .login-brand-card,
        .login-panel-card {
          border: 1px solid rgba(148,163,184,0.22);
          background: rgba(15,23,42,0.74);
          box-shadow: 0 24px 80px rgba(0,0,0,0.35);
          backdrop-filter: blur(18px);
          border-radius: 28px;
          overflow: hidden;
        }

        .login-brand-card {
          position: relative;
          padding: 34px;
          min-height: 610px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .login-brand-card::before {
          content: "";
          position: absolute;
          inset: -80px -120px auto auto;
          width: 280px;
          height: 280px;
          background: rgba(59,130,246,0.32);
          filter: blur(50px);
          border-radius: 999px;
        }

        .login-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.12);
          color: #bfdbfe;
          border: 1px solid rgba(96,165,250,0.28);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .login-title {
          font-size: 42px;
          line-height: 1.08;
          margin: 22px 0 14px;
          letter-spacing: -0.04em;
        }

        .login-subtitle {
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.7;
          max-width: 560px;
        }

        .login-feature-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 28px;
        }

        .login-feature {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .login-feature b {
          display: block;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .login-feature span {
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.45;
        }

        .login-steps {
          margin-top: 26px;
          padding: 18px;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(16,185,129,0.14), rgba(59,130,246,0.10));
          border: 1px solid rgba(45,212,191,0.20);
        }

        .login-steps-title {
          font-weight: 900;
          margin-bottom: 12px;
        }

        .login-step-row {
          display: grid;
          grid-template-columns: 32px 1fr;
          gap: 10px;
          align-items: start;
          color: #cbd5e1;
          font-size: 13px;
          margin: 9px 0;
        }

        .login-step-number {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          background: rgba(34,197,94,0.16);
          color: #86efac;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          border: 1px solid rgba(134,239,172,0.22);
        }

        .login-panel-card {
          padding: 22px;
        }

        .login-mode-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 6px;
          border-radius: 18px;
          background: rgba(2,6,23,0.45);
          border: 1px solid rgba(148,163,184,0.16);
          margin-bottom: 18px;
        }

        .login-mode-tab {
          border: 0;
          color: #94a3b8;
          background: transparent;
          border-radius: 14px;
          padding: 12px 10px;
          cursor: pointer;
          font-weight: 900;
          transition: 0.18s ease;
        }

        .login-mode-tab.active {
          background: linear-gradient(135deg, #2563eb, #10b981);
          color: white;
          box-shadow: 0 12px 26px rgba(37,99,235,0.26);
        }

        .login-card-inner {
          border-radius: 24px;
          padding: 24px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .login-card-title {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 14px;
        }

        .login-icon {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(59,130,246,0.15);
          border: 1px solid rgba(96,165,250,0.22);
          font-size: 24px;
        }

        .login-card-title h2 {
          margin: 0;
          font-size: 22px;
          letter-spacing: -0.03em;
        }

        .login-card-title p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.45;
        }

        .login-input-group {
          margin-top: 14px;
        }

        .login-input-group label {
          display: block;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .login-input-group input {
          width: 100%;
          border: 1px solid rgba(148,163,184,0.22);
          border-radius: 16px;
          background: rgba(2,6,23,0.48);
          color: #f8fafc;
          outline: none;
          padding: 13px 14px;
          box-sizing: border-box;
          font-size: 14px;
        }

        .login-input-group input:focus {
          border-color: rgba(59,130,246,0.7);
          box-shadow: 0 0 0 4px rgba(59,130,246,0.13);
        }

        .login-action-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .login-primary-btn,
        .login-secondary-btn {
          border: 0;
          border-radius: 16px;
          padding: 13px 15px;
          cursor: pointer;
          font-weight: 900;
          transition: 0.18s ease;
        }

        .login-primary-btn {
          flex: 1;
          color: white;
          background: linear-gradient(135deg, #2563eb, #10b981);
          box-shadow: 0 14px 32px rgba(37,99,235,0.22);
        }

        .login-secondary-btn {
          color: #e2e8f0;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(148,163,184,0.18);
        }

        .login-primary-btn:disabled,
        .login-secondary-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .login-error-box {
          margin: 14px 0;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(248,113,113,0.22);
          color: #fecaca;
          font-size: 13px;
        }

        .login-reader-box {
          margin-top: 16px;
          overflow: hidden;
          border-radius: 20px;
          background: #fff;
          padding: 10px;
        }

        .login-help-note {
          margin-top: 14px;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.55;
        }

        .login-admin-note {
          margin-top: 14px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(15,23,42,0.42);
          border: 1px dashed rgba(148,163,184,0.24);
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.55;
        }

        @media (max-width: 900px) {
          .login-modern-shell {
            padding: 14px;
            align-items: flex-start;
          }

          .login-modern-wrap {
            grid-template-columns: 1fr;
          }

          .login-brand-card {
            min-height: auto;
            padding: 24px;
          }

          .login-title {
            font-size: 30px;
          }

          .login-feature-grid {
            grid-template-columns: 1fr;
          }

          .login-panel-card {
            padding: 14px;
          }

          .login-card-inner {
            padding: 18px;
          }
        }
      `}</style>

      <div className="login-modern-wrap">
        <section className="login-brand-card">
          <div>
            <div className="login-eyebrow">✨ Portal Bimbel Cerdas</div>
            <h1 className="login-title">Pantau perkembangan anak jadi lebih mudah.</h1>
            <p className="login-subtitle">
              Orang tua cukup scan barcode siswa untuk melihat jadwal belajar, riwayat hadir,
              laporan perkembangan, dan informasi pembayaran tanpa harus membuat akun khusus.
            </p>

            <div className="login-feature-grid">
              <div className="login-feature">
                <b>📚 Perkembangan</b>
                <span>Lihat catatan belajar terbaru dari guru.</span>
              </div>
              <div className="login-feature">
                <b>📅 Jadwal</b>
                <span>Tahu hari dan sesi belajar siswa.</span>
              </div>
              <div className="login-feature">
                <b>✅ Kehadiran</b>
                <span>Pantau kapan siswa hadir dan tidak hadir.</span>
              </div>
              <div className="login-feature">
                <b>💳 Pembayaran</b>
                <span>Cek riwayat dan perkiraan tagihan.</span>
              </div>
            </div>
          </div>

          <div className="login-steps">
            <div className="login-steps-title">Cara masuk orang tua</div>
            <div className="login-step-row">
              <span className="login-step-number">1</span>
              <span>Siapkan kartu barcode / QR siswa.</span>
            </div>
            <div className="login-step-row">
              <span className="login-step-number">2</span>
              <span>Klik tombol scan barcode di halaman login.</span>
            </div>
            <div className="login-step-row">
              <span className="login-step-number">3</span>
              <span>Data siswa akan terbuka khusus untuk barcode tersebut.</span>
            </div>
          </div>
        </section>

        <section className="login-panel-card">
          <div className="login-mode-tabs">
            <button
              type="button"
              className={`login-mode-tab ${mode === 'orangtua' ? 'active' : ''}`}
              onClick={() => setMode('orangtua')}
            >
              Orang Tua
            </button>
            <button
              type="button"
              className={`login-mode-tab ${mode === 'admin' ? 'active' : ''}`}
              onClick={() => setMode('admin')}
            >
              Admin / Guru
            </button>
          </div>

          {mode === 'orangtua' ? (
            <div className="login-card-inner">
              <div className="login-card-title">
                <span className="login-icon">🎓</span>
                <div>
                  <h2>Masuk dengan Barcode Siswa</h2>
                  <p>Scan barcode siswa atau ketik kode secara manual.</p>
                </div>
              </div>

              {loginError ? <div className="login-error-box">{loginError}</div> : null}

              <div className="login-input-group">
                <label>Kode barcode siswa</label>
                <input
                  value={barcodeSiswa}
                  onChange={(event) => setBarcodeSiswa(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') masukDenganBarcodeSiswa(barcodeSiswa)
                  }}
                  placeholder="Contoh: QR-001 atau kode barcode siswa"
                />
              </div>

              <div className="login-action-row">
                <button
                  type="button"
                  className="login-secondary-btn"
                  onClick={() => setScanBarcodeAktif((prev) => !prev)}
                  disabled={loadingLogin}
                >
                  {scanBarcodeAktif ? 'Tutup Kamera' : '📷 Scan'}
                </button>

                <button
                  type="button"
                  className="login-primary-btn"
                  onClick={() => masukDenganBarcodeSiswa(barcodeSiswa)}
                  disabled={loadingLogin || !String(barcodeSiswa || '').trim()}
                >
                  {loadingLogin ? 'Memproses...' : 'Masuk Portal'}
                </button>
              </div>

              {scanBarcodeAktif ? (
                <div className="login-reader-box">
                  <div id="reader-login-siswa" style={{ width: '100%' }} />
                </div>
              ) : null}

              <div className="login-help-note">
                Akses ini hanya menampilkan data siswa sesuai barcode yang discan.
                Untuk keamanan, jangan membagikan barcode siswa kepada orang lain.
              </div>
            </div>
          ) : (
            <div className="login-card-inner">
              <div className="login-card-title">
                <span className="login-icon">🔐</span>
                <div>
                  <h2>Login Admin / Guru</h2>
                  <p>Masuk ke dashboard operasional bimbel.</p>
                </div>
              </div>

              {loginError ? <div className="login-error-box">{loginError}</div> : null}

              <div className="login-input-group">
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="master@gmail.com" />
              </div>

              <div className="login-input-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" />
              </div>

              <div className="login-action-row">
                <button className="login-primary-btn" onClick={onLogin} disabled={loadingLogin}>
                  {loadingLogin ? 'Memproses...' : 'Login ke Dashboard'}
                </button>
              </div>

              <div className="login-admin-note">
                Menu ini khusus untuk master, admin, guru, kasir, dan karyawan yang memiliki akun sistem.
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
