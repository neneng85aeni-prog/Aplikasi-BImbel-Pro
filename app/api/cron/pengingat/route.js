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

    const { data: daftarSiswa, error: errSiswa } = await supabase
      .from('siswa') 
      .select(`
        nama, 
        no_hp, 
        jam_mulai, 
        program:program_id (nama)
      `) 
      .eq('hari', hariIni) // Matikan sementara untuk tes
      .not('no_hp', 'is', null) // FILTER 1: Jangan ambil yang Null
      .neq('no_hp', '')         // FILTER 2: Jangan ambil yang kosong/blank
      // .limit(1); 

    if (errSiswa) throw errSiswa;

    if (!daftarSiswa || daftarSiswa.length === 0) {
      return NextResponse.json({ 
        message: 'Tidak ditemukan siswa dengan nomor HP yang valid di database.' 
      }, { status: 200 });
    }

    const antreanPesan = daftarSiswa.map((siswa) => {
      const namaProgram = siswa.program?.nama || 'Mata Pelajaran';

      return {
        no_wa: siswa.no_hp,
        pesan: `*INFO JADWAL BIMBEL TOP* 📍\n\nHalo Assalamu'alaikum Ayah/Bunda dari ananda *${siswa.nama}*, Hari ini ananda ada Jawal Belajar ya :\n\n📖 *Program: ${namaProgram}*\n🕙 *${siswa.jam_mulai} WIB*\n\nSampai jumpa di kelas! 🚀`,
        status: 'pending'
      };
    });

    const { error: errQueue } = await supabase
      .from('wa_queue')
      .insert(antreanPesan);

    if (errQueue) throw errQueue;

    return NextResponse.json({ 
      success: true, 
      message: `TES BERHASIL! Pesan untuk ${daftarSiswa[0].nama} telah masuk ke antrean.`,
      nomor_tujuan: daftarSiswa[0].no_hp
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
