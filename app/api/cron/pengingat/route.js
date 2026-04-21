import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

export async function GET() {
  try {
    const hariIni = new Intl.DateTimeFormat('id-ID', { 
      weekday: 'long',
      timeZone: 'Asia/Jakarta' 
    }).format(new Date());

    // LOGIKA TES PAKSA: Ambil 1 data apa pun tanpa peduli hari
    const { data: daftarSiswa, error: errSiswa } = await supabase
      .from('siswa') 
      .select(`
        nama, 
        no_hp, 
        jam_mulai, 
        program:program_id (nama)
      `) 
      // .eq('hari', hariIni)  <-- SYARAT HARI KITA MATIKAN SEMENTARA (ditandai dengan //)
      .limit(1); // <-- Batasi ambil 1 data saja agar robot tidak nyepam ke siswa lain

    if (errSiswa) throw errSiswa;

    if (!daftarSiswa || daftarSiswa.length === 0) {
      return NextResponse.json({ message: 'Tabel siswa kamu benar-benar kosong atau tidak terbaca.' }, { status: 200 });
    }

    const antreanPesan = daftarSiswa.map((siswa) => {
      const namaProgram = siswa.program?.nama || 'Mata Pelajaran';

      return {
        no_wa: siswa.no_hp,
        pesan: `*INFO JADWAL BIMBEL TOP* 📍\n\nHalo *${siswa.nama}*, ini adalah PESAN TES sistem:\n\n📖 *Program: ${namaProgram}*\n🕙 *${siswa.jam_mulai} WIB*\n\nSampai jumpa di kelas! 🚀`,
        status: 'pending'
      };
    });

    const { error: errQueue } = await supabase
      .from('wa_queue')
      .insert(antreanPesan);

    if (errQueue) throw errQueue;

    // Menampilkan hasil detail di browser agar kita bisa investigasi
    return NextResponse.json({ 
      success: true, 
      message: `TES BERHASIL! 1 pesan telah masuk ke database antrean.`,
      debug_hari_terdeteksi: hariIni,
      data_uji_coba: daftarSiswa
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
