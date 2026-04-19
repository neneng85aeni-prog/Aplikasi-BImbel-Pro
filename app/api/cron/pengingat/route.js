import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inisiasi Supabase menggunakan Environment Variables di Vercel
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

export async function GET() {
  try {
    // 1. Dapatkan hari ini dalam format bahasa Indonesia (Senin, Selasa, dst)
    const hariIni = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());

    // 2. Ambil data siswa berdasarkan kolom asli di database Supabase
    const { data: daftarSiswa, error: errSiswa } = await supabase
      .from('siswa') 
      .select('nama, no_hp, kelas, jam_mulai')
      .eq('hari', hariIni);

    if (errSiswa) throw errSiswa;

    if (!daftarSiswa || daftarSiswa.length === 0) {
      return NextResponse.json({ message: 'Tidak ada jadwal untuk hari ini.' }, { status: 200 });
    }

    // 3. Susun pesan menggunakan Template Opsi 2 (Bimbel TOP)
    const antreanPesan = daftarSiswa.map((siswa) => ({
      no_wa: siswa.no_hp,
      pesan: `*INFO JADWAL BIMBEL TOP* 📍\n\nHalo *${siswa.nama}*, jangan lupa jadwal bimbingan hari ini:\n\n📖 *Kelas: ${siswa.kelas}*\n🕙 *${siswa.jam_mulai} WIB*\n\nSampai jumpa di kelas! 🚀`,
      status: 'pending'
    }));

    // 4. Masukkan ke tabel wa_queue
    const { error: errQueue } = await supabase
      .from('wa_queue')
      .insert(antreanPesan);

    if (errQueue) throw errQueue;

    return NextResponse.json({ 
      success: true, 
      message: `${antreanPesan.length} pesan berhasil masuk antrean robot.` 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
