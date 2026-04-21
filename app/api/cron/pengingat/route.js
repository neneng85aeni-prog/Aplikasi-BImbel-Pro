import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 1. TAMBAHAN WAJIB: Memaksa Vercel agar tidak melakukan cache pada file ini
export const dynamic = 'force-dynamic'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

export async function GET() {
  try {
    // 2. PERBAIKAN WAKTU: Memaksa sistem menggunakan zona waktu Jakarta (WIB)
    const hariIni = new Intl.DateTimeFormat('id-ID', { 
      weekday: 'long',
      timeZone: 'Asia/Jakarta' 
    }).format(new Date());

    const { data: daftarSiswa, error: errSiswa } = await supabase
      .from('siswa') 
      .select(`
        nama, 
        no_hp, 
        jam_mulai, 
        program:program_id (nama)
      `) 
      .eq('hari', hariIni);

    if (errSiswa) throw errSiswa;

    if (!daftarSiswa || daftarSiswa.length === 0) {
      return NextResponse.json({ message: `Tidak ada jadwal untuk hari ${hariIni}.` }, { status: 200 });
    }

    const antreanPesan = daftarSiswa.map((siswa) => {
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
      message: `${antreanPesan.length} pesan berhasil dijadwalkan untuk hari ${hariIni}.` 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
