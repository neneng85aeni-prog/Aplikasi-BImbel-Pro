import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

export async function GET() {
  try {
    const hariIni = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());

    // LOGIKA JOIN: Kita mengambil data siswa DAN kolom 'nama' dari tabel 'program'
    const { data: daftarSiswa, error: errSiswa } = await supabase
      .from('siswa') 
      .select(`
        nama, 
        no_hp, 
        jam_mulai, 
        program:program_id (nama)
      `) // Mengambil 'nama' dari tabel yang dirujuk oleh program_id
      .eq('hari', hariIni);

    if (errSiswa) throw errSiswa;

    if (!daftarSiswa || daftarSiswa.length === 0) {
      return NextResponse.json({ message: 'Tidak ada jadwal untuk hari ini.' }, { status: 200 });
    }

    // 3. Susun pesan menggunakan data dari tabel program
    const antreanPesan = daftarSiswa.map((siswa) => {
      // Mengambil nama program, jika tidak ada gunakan teks default
      const namaProgram = siswa.program?.nama || 'Mata Pelajaran';

      return {
        no_wa: siswa.no_hp,
        pesan: `*INFO JADWAL BIMBEL TOP* 📍\n\nHalo *${siswa.nama}*, jangan lupa jadwal bimbingan hari ini:\n\n📖 *Program: ${namaProgram}*\n🕙 *${siswa.jam_mulai} WIB*\n\nSampai jumpa di kelas! 🚀`,
        status: 'pending'
      };
    });

    const { error: errQueue } = await supabase
      .from('wa_queue')
      .insert(antreanPesan);

    if (errQueue) throw errQueue;

    return NextResponse.json({ 
      success: true, 
      message: `${antreanPesan.length} pesan berhasil dijadwalkan.` 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
