'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import {
  EMPLOYEE_GLOBAL_IN,
  EMPLOYEE_GLOBAL_OUT,
  INITIAL_BONUS_FORM,
  INITIAL_BRANCH_FORM,
  INITIAL_EMPLOYEE_MANUAL_FORM,
  INITIAL_KASIR_FORM,
  INITIAL_PERKEMBANGAN_FORM,
  INITIAL_PROGRAM_FORM,
  INITIAL_REVIEW_FORM,
  INITIAL_SISWA_FORM,
  INITIAL_STUDENT_ATTENDANCE_FORM,
  INITIAL_USER_FORM,
  TODAY,
  allowedTabs,
  defaultPermissionsByRole,
  normalizePermissions,
} from '../lib/constants'
import { formatMonthYear, formatRupiah, generateStudentBarcode } from '../lib/format'
import { loginWithRpc } from '../lib/auth'
import {
  fetchAllData,
  removeById,
  saveBonus,
  saveEmployeeAttendance,
  saveEmployeeManualAttendance,
  saveKasirTransaction,
  savePerkembangan,
  saveReview,
  saveStudentAttendance,
  saveStudentCheckout,
  saveUserPermissions,
  upsertBranch,
  upsertProgram,
  upsertSiswa,
  upsertUserViaRpc,
} from '../lib/data'
import {
  validateBonusForm,
  validateBranchForm,
  validateEmployeeManualForm,
  validateKasirForm,
  validatePerkembanganForm,
  validateProgramForm,
  validateReviewForm,
  validateSiswaForm,
  validateStudentAttendanceForm,
  validateUserForm,
} from '../lib/validation'
import { clearSession, readSession, saveSession } from '../lib/session'
import { downloadCsv, exportRows } from '../lib/export'
import { buildFinanceSummary, computeOverview, computePayroll, filterByUserBranch } from '../lib/reporting'
import { printBarcodeCard } from '../components/ui/BarcodePreview'
import QRCode from 'qrcode'
function normalizeUserPayload(row) {
  if (!row) return row
  return {
    ...row,
    menu_permissions: normalizePermissions(row.menu_permissions, row.akses),
  }
}

export function useBimbelApp() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingData, setLoadingData] = useState(false)

  const [branches, setBranches] = useState([])
  const [programs, setPrograms] = useState([])
  const [users, setUsers] = useState([])
  const [siswa, setSiswa] = useState([])
  const [pembayaran, setPembayaran] = useState([])
  const [absensiSiswa, setAbsensiSiswa] = useState([])
  const [perkembangan, setPerkembangan] = useState([])
  const [absensiKaryawan, setAbsensiKaryawan] = useState([])
  const [bonusManual, setBonusManual] = useState([])
  const [reviews, setReviews] = useState([])

  const [branchForm, setBranchForm] = useState(INITIAL_BRANCH_FORM)
  const [programForm, setProgramForm] = useState(INITIAL_PROGRAM_FORM)
  const [userForm, setUserForm] = useState(INITIAL_USER_FORM)
  const [siswaForm, setSiswaForm] = useState(INITIAL_SISWA_FORM)
  const [perkembanganForm, setPerkembanganForm] = useState(INITIAL_PERKEMBANGAN_FORM)
  const [kasirForm, setKasirForm] = useState(INITIAL_KASIR_FORM)
  const [bonusForm, setBonusForm] = useState(INITIAL_BONUS_FORM)
  const [employeeManualForm, setEmployeeManualForm] = useState(INITIAL_EMPLOYEE_MANUAL_FORM)
  const [studentAttendanceForm, setStudentAttendanceForm] = useState(INITIAL_STUDENT_ATTENDANCE_FORM)
  const [reviewForm, setReviewForm] = useState(INITIAL_REVIEW_FORM)

  const [permissionUserId, setPermissionUserId] = useState('')
  const [permissionDraft, setPermissionDraft] = useState([])

  const [scanStudentActive, setScanStudentActive] = useState(false)
  const [scanEmployeeActive, setScanEmployeeActive] = useState(false)
  const [employeeMode, setEmployeeMode] = useState('datang')
  const [studentScanText, setStudentScanText] = useState('')
  const [employeeScanText, setEmployeeScanText] = useState('')
  const [studentScanInfo, setStudentScanInfo] = useState('Belum ada hasil scan siswa.')
  const [employeeScanInfo, setEmployeeScanInfo] = useState('Belum ada hasil scan karyawan.')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedGuruStudent, setSelectedGuruStudent] = useState(null)
  const [selectedProgressStudent, setSelectedProgressStudent] = useState(null)
  const [exportType, setExportType] = useState('siswa')
  const [exportDateFrom, setExportDateFrom] = useState('')
  const [exportDateTo, setExportDateTo] = useState('')
  const [progressInputMode, setProgressInputMode] = useState('scan')
  const [lastReceipt, setLastReceipt] = useState(null)
  const [selectedBranchId, setSelectedBranchId] = useState('')

  const studentScannerRef = useRef(null)
  const employeeScannerRef = useRef(null)

  const visibleTabs = useMemo(() => allowedTabs(user?.akses, user?.menu_permissions), [user])
  const selectedBranch = useMemo(() => branches.find((item) => item.id === selectedBranchId) || branches.find((item) => item.id === user?.branch_id) || branches[0] || null, [branches, selectedBranchId, user])
  const employeeBarcodeIn = selectedBranch?.employee_barcode_in || EMPLOYEE_GLOBAL_IN
  const employeeBarcodeOut = selectedBranch?.employee_barcode_out || EMPLOYEE_GLOBAL_OUT

  const usersTampil = useMemo(() => filterByUserBranch(users, user), [users, user])
  const siswaScoped = useMemo(() => filterByUserBranch(siswa, user), [siswa, user])
  const pembayaranScoped = useMemo(() => filterByUserBranch(pembayaran, user, 'branch_id'), [pembayaran, user])
  const absensiSiswaScoped = useMemo(() => filterByUserBranch(absensiSiswa, user, 'branch_id'), [absensiSiswa, user])
  const perkembanganScoped = useMemo(() => filterByUserBranch(perkembangan, user, 'branch_id'), [perkembangan, user])
  const absensiKaryawanScoped = useMemo(() => filterByUserBranch(absensiKaryawan, user, 'branch_id'), [absensiKaryawan, user])
  const bonusManualScoped = useMemo(() => filterByUserBranch(bonusManual, user, 'branch_id'), [bonusManual, user])
  const reviewsScoped = useMemo(() => filterByUserBranch(reviews, user, 'branch_id'), [reviews, user])

  const siswaTampil = useMemo(() => {
    let rows = siswaScoped
    if (selectedBranchId) rows = rows.filter((item) => item.branch_id === selectedBranchId)
    if (user?.akses === 'guru') rows = rows.filter((item) => item.guru_id === user.id || !item.guru_id)
    return rows
  }, [siswaScoped, selectedBranchId, user])

  const pembayaranTampil = useMemo(() => selectedBranchId ? pembayaranScoped.filter((item) => item.branch_id === selectedBranchId) : pembayaranScoped, [pembayaranScoped, selectedBranchId])
  const perkembanganTampil = useMemo(() => selectedBranchId ? perkembanganScoped.filter((item) => item.siswa?.branch_id === selectedBranchId || item.users?.branch_id === selectedBranchId) : perkembanganScoped, [perkembanganScoped, selectedBranchId])
  const absensiKaryawanTampil = useMemo(() => selectedBranchId ? absensiKaryawanScoped.filter((item) => item.users?.branch_id === selectedBranchId) : absensiKaryawanScoped, [absensiKaryawanScoped, selectedBranchId])
  const bonusManualTampil = useMemo(() => selectedBranchId ? bonusManualScoped.filter((item) => item.branch_id === selectedBranchId) : bonusManualScoped, [bonusManualScoped, selectedBranchId])
  const absensiSiswaTampil = useMemo(() => selectedBranchId ? absensiSiswaScoped.filter((item) => item.branch_id === selectedBranchId) : absensiSiswaScoped, [absensiSiswaScoped, selectedBranchId])
  const reviewsTampil = useMemo(() => selectedBranchId ? reviewsScoped.filter((item) => item.branch_id === selectedBranchId) : reviewsScoped, [reviewsScoped, selectedBranchId])
  const perkembanganHistory = useMemo(() => {
    if (!perkembanganForm.siswa_id) return []
    return perkembanganTampil
      .filter((item) => item.siswa_id === perkembanganForm.siswa_id)
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
      .slice(0, 5)
  }, [perkembanganTampil, perkembanganForm.siswa_id])

  const guruOptions = useMemo(() => usersTampil.filter((item) => item.akses === 'guru'), [usersTampil])
  const payrollRows = useMemo(() => computePayroll({ users: usersTampil, absensiSiswa: absensiSiswaTampil, bonusManual: bonusManualTampil }), [usersTampil, absensiSiswaTampil, bonusManualTampil])
  const overview = useMemo(() => computeOverview({ pembayaran: pembayaranTampil, siswa: siswaTampil, users: usersTampil, branches: selectedBranchId ? branches.filter((b) => b.id === selectedBranchId) : branches, payrollRows }), [pembayaranTampil, siswaTampil, usersTampil, branches, selectedBranchId, payrollRows])
  const financeSummary = useMemo(() => buildFinanceSummary(pembayaranTampil, payrollRows, bonusManualTampil, selectedBranchId ? branches.filter((b) => b.id === selectedBranchId) : branches), [pembayaranTampil, payrollRows, bonusManualTampil, branches, selectedBranchId])
  const stats = useMemo(() => ({ siswa: siswaTampil.length, pegawai: usersTampil.length, program: programs.length, pemasukan: pembayaranTampil.reduce((sum, item) => sum + Number(item.nominal || 0), 0) }), [siswaTampil, usersTampil, programs, pembayaranTampil])

  useEffect(() => {
    const cachedUser = readSession()
    if (cachedUser) setUser(normalizeUserPayload(cachedUser))
  }, [])

  useEffect(() => {
    if (user) loadAllData()
  }, [user])

  useEffect(() => {
    if (user?.branch_id && !selectedBranchId) setSelectedBranchId(user.branch_id)
  }, [user, selectedBranchId])

  useEffect(() => {
    if (!permissionUserId) {
      setPermissionDraft([])
      return
    }
    const selected = usersTampil.find((item) => item.id === permissionUserId)
    setPermissionDraft(normalizePermissions(selected?.menu_permissions, selected?.akses))
  }, [permissionUserId, usersTampil])

  useEffect(() => {
    if (!perkembanganForm.siswa_id) {
      setSelectedProgressStudent(null)
      return
    }
    const selected = siswaTampil.find((item) => item.id === perkembanganForm.siswa_id) || null
    setSelectedProgressStudent(selected)
  }, [perkembanganForm.siswa_id, siswaTampil])

  useEffect(() => {
    if (!scanStudentActive) return undefined
    const scanner = new Html5QrcodeScanner('reader-siswa', { qrbox: { width: 220, height: 220 }, fps: 5, rememberLastUsedCamera: true }, false)
    studentScannerRef.current = scanner
    scanner.render(async (decodedText) => {
      setStudentScanText(decodedText)
      if (activeTab === 'perkembangan') await prosesScanPerkembangan(decodedText)
      else await prosesScanSiswa(decodedText)
      setScanStudentActive(false)
    }, () => {})
    return () => {
      scanner.clear().catch(() => {})
      studentScannerRef.current = null
    }
  }, [scanStudentActive, activeTab, user, siswaTampil, perkembanganForm])

  useEffect(() => {
    if (!scanEmployeeActive) return undefined
    const scanner = new Html5QrcodeScanner('reader-karyawan', { qrbox: { width: 220, height: 220 }, fps: 5, rememberLastUsedCamera: true }, false)
    employeeScannerRef.current = scanner
    scanner.render(async (decodedText) => {
      setEmployeeScanText(decodedText)
      await prosesScanKaryawan(decodedText)
      setScanEmployeeActive(false)
    }, () => {})
    return () => {
      scanner.clear().catch(() => {})
      employeeScannerRef.current = null
    }
  }, [scanEmployeeActive, employeeMode, user, employeeBarcodeIn, employeeBarcodeOut])

  async function loadAllData() {
    try {
      setLoadingData(true)
      setErrorMsg('')
      const data = await fetchAllData()
      setBranches(data.branches)
      setPrograms(data.programs)
      setUsers((data.users || []).map(normalizeUserPayload))
      setSiswa(data.siswa)
      setPembayaran(data.pembayaran)
      setAbsensiSiswa(data.absensiSiswa)
      setPerkembangan(data.perkembangan)
      setAbsensiKaryawan(data.absensiKaryawan)
      setBonusManual(data.bonusManual)
      setReviews(data.reviews)
    } catch (error) {
      setErrorMsg(error.message || 'Gagal mengambil data.')
    } finally {
      setLoadingData(false)
    }
  }

  async function login() {
    setLoadingLogin(true)
    setLoginError('')
    try {
      const loggedInUser = normalizeUserPayload(await loginWithRpc(email, password))
      setUser(loggedInUser)
      saveSession(loggedInUser)
      setMessage(`Login berhasil sebagai ${loggedInUser.akses}.`)
    } catch (error) {
      setLoginError(error.message || 'Login gagal.')
    } finally {
      setLoadingLogin(false)
    }
  }

  function logout() {
    setUser(null)
    setEmail('')
    setPassword('')
    setActiveTab('overview')
    clearSession()
    setMessage('Logout berhasil.')
  }

  async function submitBranch(event) {
    event.preventDefault()
    try {
      const payload = validateBranchForm(branchForm)
      const res = await upsertBranch(payload, branchForm.id)
      if (res.error) throw res.error
      setBranchForm(INITIAL_BRANCH_FORM)
      setMessage('Cabang berhasil disimpan.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan cabang.')
    }
  }

  async function deleteBranch(id) {
    if (!window.confirm('Hapus cabang ini?')) return
    const { error } = await removeById('branches', id)
    if (error) return setErrorMsg(error.message || 'Gagal menghapus cabang.')
    setMessage('Cabang berhasil dihapus.')
    await loadAllData()
  }

  async function submitProgram(event) {
    event.preventDefault()
    try {
      const payload = validateProgramForm(programForm)
      const res = await upsertProgram(payload, programForm.id)
      if (res.error) throw res.error
      setProgramForm(INITIAL_PROGRAM_FORM)
      setMessage('Program berhasil disimpan.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan program.')
    }
  }

  async function deleteProgram(id) {
    if (!window.confirm('Hapus program ini?')) return
    const { error } = await removeById('programs', id)
    if (error) return setErrorMsg(error.message || 'Gagal menghapus program.')
    setMessage('Program berhasil dihapus.')
    await loadAllData()
  }

  async function submitUser(event) {
    event.preventDefault()
    try {
      const payload = validateUserForm({ ...userForm, menu_permissions: userForm.menu_permissions?.length ? userForm.menu_permissions : defaultPermissionsByRole(userForm.akses) })
      const res = await upsertUserViaRpc(payload, userForm.id)
      if (res.error) throw res.error
      setUserForm(INITIAL_USER_FORM)
      setMessage('Karyawan, kontak, dan skema gaji berhasil disimpan.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan karyawan.')
    }
  }

  async function deleteUser(id) {
    if (!window.confirm('Hapus user ini?')) return
    const { error } = await removeById('users', id)
    if (error) return setErrorMsg(error.message || 'Gagal menghapus user.')
    setMessage('User berhasil dihapus.')
    await loadAllData()
  }

  function generateStudentBarcodeAction() {
    const branchCode = branches.find((item) => item.id === siswaForm.branch_id)?.kode || selectedBranch?.kode || 'PUSAT'
    setSiswaForm((prev) => ({ ...prev, kode_qr: generateStudentBarcode({ nama: prev.nama, kelas: prev.kelas, branchCode }) }))
  }

  async function submitSiswa(event) {
    event.preventDefault()
    try {
      const enriched = siswaForm.kode_qr ? siswaForm : { ...siswaForm, kode_qr: generateStudentBarcode({ nama: siswaForm.nama, kelas: siswaForm.kelas, branchCode: branches.find((item) => item.id === siswaForm.branch_id)?.kode }) }
      const payload = validateSiswaForm(enriched)
      const res = await upsertSiswa(payload, siswaForm.id)
      if (res.error) throw res.error
      setSiswaForm(INITIAL_SISWA_FORM)
      setMessage('Data siswa berhasil disimpan.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan siswa.')
    }
  }

  async function deleteSiswa(id) {
    if (!window.confirm('Hapus siswa ini?')) return
    const { error } = await removeById('siswa', id)
    if (error) return setErrorMsg(error.message || 'Gagal menghapus siswa.')
    setMessage('Siswa berhasil dihapus.')
    await loadAllData()
  }

  function printStudentBarcode(item) {
  const isAndroid = /Android/i.test(navigator.userAgent)

  if (isAndroid) {
    QRCode.toDataURL(item.kode_qr || item.id, { margin: 1, width: 300 })
      .then((url) => {
        const link = document.createElement('a')
        link.href = url
        link.download = `${item.nama}-barcode.png`
        link.click()

        alert('QR disimpan. Silakan buka aplikasi printer bluetooth dan print gambar.')
      })
    return
  }

  printBarcodeCard({
    title: `Barcode ${item.nama}`,
    subtitle: `${item.branches?.nama || '-'} • ${item.kelas || ''}`,
    value: item.kode_qr || item.id,
  })
}

  async function submitPerkembangan(event) {
    event.preventDefault()
    try {
      const payload = validatePerkembanganForm(perkembanganForm)
      const matched = siswaTampil.find((item) => item.id === payload.siswa_id)
      if (!matched) throw new Error('Siswa tidak ditemukan.')
      await ensureStudentSession(matched, progressInputMode === 'scan' ? 'scan' : 'manual')
      const res = await savePerkembangan({
        ...payload,
        guru_id: user?.akses === 'guru' ? user.id : (perkembanganForm.guru_handle_id || matched.guru_id || null),
      })
      if (res.error) throw res.error
      setPerkembanganForm((prev) => ({
        ...INITIAL_PERKEMBANGAN_FORM,
        siswa_id: matched.id,
        guru_handle_id: user?.akses === 'guru' ? user.id : (prev.guru_handle_id || matched.guru_id || ''),
        tanggal: TODAY(),
      }))
      setMessage('Perkembangan siswa berhasil disimpan. Kehadiran hari ini juga tercatat.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan perkembangan.')
    }
  }

  function buildStudentInfo(matched) {
    return {
      ...matched,
      nominal: matched.programs?.nominal || 0,
      guruNama: matched.users?.nama || '-',
      programNama: matched.programs?.nama || '-',
    }
  }

  async function ensureStudentSession(matched, source = 'manual') {
    const guruHandleId = user?.akses === 'guru' ? user.id : (perkembanganForm.guru_handle_id || matched.guru_id || '')
    const attendancePayload = validateStudentAttendanceForm({
      ...studentAttendanceForm,
      siswa_id: matched.id,
      guru_handle_id: guruHandleId,
      tanggal: perkembanganForm.tanggal || TODAY(),
      mode: 'masuk',
      status: 'hadir',
      catatan: source === 'scan' ? 'Scan guru untuk sesi perkembangan' : 'Input manual sesi perkembangan',
    })
    const attendanceRes = await saveStudentAttendance({
      p_siswa_id: attendancePayload.siswa_id,
      p_guru_handle_id: attendancePayload.guru_handle_id,
      p_tanggal: attendancePayload.tanggal,
      p_mode: attendancePayload.mode,
      p_status: attendancePayload.status,
      p_catatan: attendancePayload.catatan,
      p_sumber: source,
    })
    if (attendanceRes.error) throw attendanceRes.error

    setPerkembanganForm((prev) => ({
      ...prev,
      siswa_id: matched.id,
      guru_handle_id: attendancePayload.guru_handle_id || '',
      tanggal: attendancePayload.tanggal,
    }))
    setStudentAttendanceForm((prev) => ({
      ...prev,
      siswa_id: matched.id,
      guru_handle_id: attendancePayload.guru_handle_id || '',
      tanggal: attendancePayload.tanggal,
      mode: 'masuk',
      status: 'hadir',
    }))
    setSelectedProgressStudent(matched)
    return attendancePayload
  }

  async function prosesScanPerkembangan(decodedText) {
    try {
      const matched = siswaTampil.find((item) => item.kode_qr === decodedText || item.id === decodedText)
      if (!matched) {
        setSelectedProgressStudent(null)
        setStudentScanInfo(`QR siswa tidak dikenali: ${decodedText}`)
        return
      }
      await ensureStudentSession(matched, 'scan')
      setStudentScanInfo(`Siswa ${matched.nama} berhasil discan. Kehadiran hari ini tercatat dan kamu bisa langsung isi perkembangan.`)
      setMessage(`Sesi belajar ${matched.nama} siap diinput.`)
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal memproses scan perkembangan siswa.')
    }
  }

  async function prosesScanSiswa(decodedText) {
    const matched = siswaTampil.find((item) => item.kode_qr === decodedText || item.id === decodedText)
    if (!matched) {
      setSelectedStudent(null)
      setStudentScanInfo(`QR siswa tidak dikenali: ${decodedText}`)
      return
    }
    const info = buildStudentInfo(matched)
    setSelectedStudent(info)
    setKasirForm({ ...INITIAL_KASIR_FORM, nominal: String(info.nominal || '') })
    setStudentScanInfo(`Data siswa ditemukan: ${matched.nama}`)
  }

  function selectStudentById(id) {
    if (!id) return setSelectedStudent(null)
    const matched = siswaTampil.find((item) => item.id === id)
    if (!matched) return
    const info = buildStudentInfo(matched)
    setSelectedStudent(info)
    setKasirForm({ ...INITIAL_KASIR_FORM, nominal: String(info.nominal || '') })
    setStudentScanInfo(`Data siswa dipilih: ${matched.nama}`)
  }

  async function selectProgressStudentById(id, source = 'manual') {
    try {
      if (!id) {
        setSelectedProgressStudent(null)
        setPerkembanganForm((prev) => ({ ...prev, siswa_id: '' }))
        return
      }
      const matched = siswaTampil.find((item) => item.id === id)
      if (!matched) return
      await ensureStudentSession(matched, source)
      setStudentScanInfo(`Sesi perkembangan untuk ${matched.nama} siap diinput.`)
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyiapkan sesi perkembangan siswa.')
    }
  }

  async function submitKasir() {
    try {
      if (!selectedStudent) throw new Error('Pilih atau scan siswa terlebih dahulu.')
      const payload = validateKasirForm(kasirForm, selectedStudent.nominal)
      const res = await saveKasirTransaction({
        p_siswa_id: selectedStudent.id,
        p_program_id: selectedStudent.program_id,
        p_kasir_id: user?.id,
        p_tanggal: TODAY(),
        p_nominal: payload.nominal,
        p_status: payload.status,
        p_metode_bayar: payload.metode_bayar,
        p_keterangan: payload.keterangan,
      })
      if (res.error) throw res.error
      if (payload.status === 'lunas') {
        setLastReceipt({ nama: selectedStudent.nama, cabang: selectedStudent.branches?.nama || '-', programNama: selectedStudent.programNama, guruNama: selectedStudent.guruNama, nominal: payload.nominal, metode_bayar: payload.metode_bayar })
      }
      setMessage('Pembayaran berhasil disimpan. Kehadiran siswa dicatat lewat menu Perkembangan & Absensi.')
      setSelectedStudent(null)
      setKasirForm(INITIAL_KASIR_FORM)
      setStudentScanText('')
      setStudentScanInfo('Belum ada hasil scan siswa.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan transaksi kasir.')
    }
  }

  async function submitStudentAttendance(event) {
    event.preventDefault()
    try {
      const payload = validateStudentAttendanceForm(studentAttendanceForm)
      const res = await saveStudentAttendance({
        p_siswa_id: payload.siswa_id,
        p_guru_handle_id: payload.guru_handle_id,
        p_tanggal: payload.tanggal,
        p_mode: payload.mode,
        p_status: payload.status,
        p_catatan: payload.catatan,
        p_sumber: 'manual',
      })
      if (res.error) throw res.error
      setStudentAttendanceForm(INITIAL_STUDENT_ATTENDANCE_FORM)
      setMessage('Absensi siswa berhasil disimpan.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan absensi siswa.')
    }
  }

  async function submitEmployeeManualAttendance(event) {
    event.preventDefault()
    try {
      const payload = validateEmployeeManualForm(employeeManualForm)
      const res = await saveEmployeeManualAttendance({
        p_user_id: payload.user_id,
        p_tanggal: payload.tanggal,
        p_status: payload.status,
        p_jam_datang: payload.jam_datang || null,
        p_jam_pulang: payload.jam_pulang || null,
        p_catatan: payload.catatan,
      })
      if (res.error) throw res.error
      setEmployeeManualForm(INITIAL_EMPLOYEE_MANUAL_FORM)
      setMessage('Absensi manual karyawan berhasil disimpan.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan absensi manual.')
    }
  }

  function printThermalReceipt(receipt) {
    const data = receipt || lastReceipt
    if (!data) {
      setErrorMsg('Belum ada data pembayaran untuk dicetak.')
      return
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Bukti Bayar</title><style>body{font-family:Arial,sans-serif;width:72mm;margin:0 auto;padding:8px;color:#000}.receipt{text-align:left;font-size:12px;line-height:1.4}.center{text-align:center}.line{border-top:1px dashed #000;margin:8px 0}.row{display:flex;justify-content:space-between;gap:8px}.label{font-weight:bold}.big{font-size:15px;font-weight:bold}@media print{body{width:72mm}}</style></head><body onload="window.print();window.close()"><div class="receipt"><div class="center big">BIMBEL PRO</div><div class="center">Bukti Pembayaran</div><div class="line"></div><div><span class="label">Tanggal:</span> ${new Date().toLocaleString('id-ID')}</div><div><span class="label">Cabang:</span> ${data.cabang || '-'}</div><div><span class="label">Nama siswa:</span> ${data.nama || '-'}</div><div><span class="label">Program:</span> ${data.programNama || '-'}</div><div><span class="label">Guru default:</span> ${data.guruNama || '-'}</div><div><span class="label">Metode bayar:</span> ${(data.metode_bayar || 'cash').toUpperCase()}</div><div><span class="label">Status:</span> ${(data.status || 'LUNAS').toUpperCase()}</div><div class="row"><span class="label">Nominal</span><span>${formatRupiah(data.nominal || 0)}</span></div><div class="line"></div><div class="center">Terima kasih</div></div></body></html>`
    const w = window.open('', '_blank', 'width=420,height=700')
    if (!w) {
      setErrorMsg('Popup printer diblokir browser. Izinkan popup lalu coba lagi.')
      return
    }
    w.document.write(html)
    w.document.close()
  }

  async function prosesScanKaryawan(decodedText) {
    try {
      const validCode = employeeMode === 'datang' ? employeeBarcodeIn : employeeBarcodeOut
      if (decodedText !== validCode) {
        setEmployeeScanInfo(`Barcode ${employeeMode} tidak dikenali untuk cabang ini.`)
        return
      }
      const res = await saveEmployeeAttendance({ p_user_id: user?.id, p_tanggal: TODAY(), p_mode: employeeMode })
      if (res.error) throw res.error
      setEmployeeScanInfo(`Scan ${employeeMode} berhasil untuk ${user?.nama}.`)
      setMessage(`Absensi karyawan ${employeeMode} berhasil disimpan.`)
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal memproses scan karyawan.')
    }
  }

  async function submitBonus(event) {
    event.preventDefault()
    try {
      const payload = validateBonusForm(bonusForm)
      const targetUser = usersTampil.find((item) => item.id === payload.user_id)
      const res = await saveBonus({
        user_id: payload.user_id,
        branch_id: targetUser?.branch_id || null,
        bonus_date: payload.bonus_date,
        amount: payload.amount,
        description: payload.description,
        created_by: user?.id || null,
      })
      if (res.error) throw res.error
      setBonusForm(INITIAL_BONUS_FORM)
      setMessage('Bonus manual berhasil disimpan.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan bonus.')
    }
  }

  function addReviewItem() {
    setReviewForm((prev) => ({ ...prev, items: [...prev.items, { title: '', score: '8', note: '' }] }))
  }

  function changeReviewItem(index, field, value) {
    setReviewForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }))
  }

  function removeReviewItem(index) {
    setReviewForm((prev) => ({ ...prev, items: prev.items.filter((_, itemIndex) => itemIndex !== index) }))
  }

  async function submitReview(event) {
    event.preventDefault()
    try {
      const payload = validateReviewForm(reviewForm)
      const res = await saveReview({ ...payload, reviewer_id: user?.id || null })
      if (res.error) throw res.error
      setReviewForm(INITIAL_REVIEW_FORM)
      setMessage('Penilaian karyawan berhasil disimpan.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan penilaian karyawan.')
    }
  }

  function printEmployeeReview(review) {
    const avg = review.items?.length ? (review.items.reduce((sum, item) => sum + Number(item.score || 0), 0) / review.items.length).toFixed(1) : '0.0'
    const rows = (review.items || []).map((item, index) => `<tr><td>${index + 1}</td><td>${item.title}</td><td style="text-align:center">${item.score}</td><td>${item.note || '-'}</td></tr>`).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Penilaian Karyawan</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#0f172a}h1,h2,p{margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:10px;font-size:12px;text-align:left}th{background:#f8fafc}.header{display:flex;justify-content:space-between;align-items:flex-start}.muted{color:#475569}.badge{display:inline-block;border:1px solid #cbd5e1;padding:4px 8px;border-radius:999px}.footer{margin-top:24px;font-size:12px;color:#475569}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px}.card{border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#fff}</style></head><body onload="window.print()"><div class="header"><div><h1>Form Penilaian Karyawan</h1><p class="muted">Periode ${formatMonthYear(review.period_month, review.period_year)}</p></div><div class="badge">Rata-rata ${avg}</div></div><div class="summary"><div class="card"><b>Nama Karyawan</b><div>${review.user?.nama || '-'}</div></div><div class="card"><b>Cabang</b><div>${review.user?.branch_nama || '-'}</div></div><div class="card"><b>Dinilai oleh</b><div>${review.reviewer?.nama || '-'}</div></div></div><table><thead><tr><th>No</th><th>Poin Penilaian</th><th>Nilai</th><th>Catatan</th></tr></thead><tbody>${rows}</tbody></table><div class="footer"><b>Catatan Umum:</b><br />${review.notes || '-'}</div></body></html>`
    const w = window.open('', '_blank', 'width=960,height=720')
    if (!w) return setErrorMsg('Popup printer diblokir browser. Izinkan popup lalu coba lagi.')
    w.document.write(html)
    w.document.close()
  }

  function togglePermissionDraft(menuKey) {
    setPermissionDraft((prev) => prev.includes(menuKey) ? prev.filter((item) => item !== menuKey) : [...prev, menuKey])
  }

  function selectAllPermissions() {
    setPermissionDraft(visibleTabs.length ? Array.from(new Set([...permissionDraft, ...visibleTabs])) : permissionDraft)
  }

  function resetPermissionDraft(nextPermissions = []) {
    setPermissionDraft(nextPermissions)
  }

  async function savePermissions() {
    try {
      if (!permissionUserId) throw new Error('Pilih user terlebih dahulu.')
      const res = await saveUserPermissions(permissionUserId, permissionDraft)
      if (res.error) throw res.error
      if (user?.id === permissionUserId) {
        const updated = { ...user, menu_permissions: permissionDraft }
        setUser(updated)
        saveSession(updated)
      }
      setMessage('Checklist hak akses berhasil disimpan.')
      await loadAllData()
    } catch (error) {
      setErrorMsg(error.message || 'Gagal menyimpan hak akses user.')
    }
  }

  function startEditBranch(item) {
    setBranchForm({ id: item.id, nama: item.nama, kode: item.kode, alamat: item.alamat || '', employee_barcode_in: item.employee_barcode_in || EMPLOYEE_GLOBAL_IN, employee_barcode_out: item.employee_barcode_out || EMPLOYEE_GLOBAL_OUT })
    setActiveTab('cabang')
  }

  function startEditProgram(item) {
    setProgramForm({ id: item.id, nama: item.nama, deskripsi: item.deskripsi || '', nominal: item.nominal || '' })
    setActiveTab('program')
  }

  function startEditUser(item) {
    setUserForm({ id: item.id, nama: item.nama, email: item.email, password: '', akses: item.akses, branch_id: item.branch_id || '', no_telepon: item.no_telepon || '', salary_type: item.salary_type || 'fixed', salary_fixed: item.salary_fixed || '', student_fee_daily: item.student_fee_daily || '', monthly_bonus_target: item.monthly_bonus_target || '', bonus_amount: item.bonus_amount || '', menu_permissions: normalizePermissions(item.menu_permissions, item.akses) })
    setActiveTab('users')
  }

  function startEditSiswa(item) {
    setSiswaForm({ id: item.id, nama: item.nama || '', branch_id: item.branch_id || '', program_id: item.program_id || '', kelas: item.kelas || '', nama_ortu: item.nama_ortu || '', no_hp: item.no_hp || '', alamat: item.alamat || '', kode_qr: item.kode_qr || '', guru_id: item.guru_id || '' })
    setActiveTab('siswa')
  }

  function setQuickExportRange(mode) {
    const today = TODAY()
    if (mode === 'today') {
      setExportDateFrom(today)
      setExportDateTo(today)
      return
    }
    if (mode === 'week') {
      const now = new Date()
      const day = now.getDay() || 7
      now.setDate(now.getDate() - (day - 1))
      const start = now.toISOString().slice(0, 10)
      setExportDateFrom(start)
      setExportDateTo(today)
      return
    }
    if (mode === 'month') {
      const now = new Date()
      now.setDate(1)
      const start = now.toISOString().slice(0, 10)
      setExportDateFrom(start)
      setExportDateTo(today)
      return
    }
    setExportDateFrom('')
    setExportDateTo('')
  }

  function handleDownload() {
    const rows = exportRows({ exportType, branches, siswa: siswaTampil, users: usersTampil, programs, pembayaran: pembayaranTampil, absensiSiswa: absensiSiswaTampil, absensiKaryawan: absensiKaryawanTampil, perkembangan: perkembanganTampil, payrollRows, dateFrom: exportDateFrom, dateTo: exportDateTo })
    if (!rows.length) {
      setErrorMsg('Tidak ada data untuk didownload.')
      return
    }
    downloadCsv(exportType, rows)
    setMessage(`Data ${exportType} berhasil didownload.`)
  }

  return {
    state: {
      user, email, password, loginError, loadingLogin, activeTab, message, errorMsg, loadingData,
      branches, programs, users, siswa, pembayaran, absensiSiswa, perkembangan, absensiKaryawan, bonusManual, reviews,
      branchForm, programForm, userForm, siswaForm, perkembanganForm, kasirForm, bonusForm, employeeManualForm, studentAttendanceForm, reviewForm,
      permissionUserId, permissionDraft,
      scanStudentActive, scanEmployeeActive, employeeMode, studentScanText, employeeScanText,
      studentScanInfo, employeeScanInfo, selectedStudent, selectedGuruStudent, selectedProgressStudent,
      exportType, exportDateFrom, exportDateTo, lastReceipt, selectedBranchId, selectedBranch, employeeBarcodeIn, employeeBarcodeOut, progressInputMode,
      guruOptions, visibleTabs, usersTampil, siswaTampil, pembayaranTampil, perkembanganTampil, perkembanganHistory, absensiKaryawanTampil, bonusManualTampil, absensiSiswaTampil, reviewsTampil, overview, financeSummary, payrollRows, stats,
    },
    actions: {
      setUser, setEmail, setPassword, setActiveTab, setMessage, setErrorMsg, setSelectedBranchId,
      setBranchForm, setProgramForm, setUserForm, setSiswaForm, setPerkembanganForm, setKasirForm, setBonusForm, setEmployeeManualForm, setStudentAttendanceForm, setReviewForm,
      setPermissionUserId, setPermissionDraft,
      setScanStudentActive, setScanEmployeeActive, setEmployeeMode, setExportType, setExportDateFrom, setExportDateTo, setProgressInputMode,
      login, logout, loadAllData,
      submitBranch, deleteBranch, submitProgram, deleteProgram, submitUser, deleteUser, submitSiswa, deleteSiswa,
      submitPerkembangan, submitKasir, submitBonus, submitEmployeeManualAttendance, submitStudentAttendance, submitReview,
      prosesScanSiswa, prosesScanPerkembangan, prosesScanKaryawan,
      startEditBranch, startEditProgram, startEditUser, startEditSiswa, handleDownload, printThermalReceipt,
      selectStudentById, selectProgressStudentById, generateStudentBarcodeAction, printStudentBarcode,
      addReviewItem, changeReviewItem, removeReviewItem, printEmployeeReview, togglePermissionDraft, savePermissions, selectAllPermissions, resetPermissionDraft, setQuickExportRange,
    },
  }
}
