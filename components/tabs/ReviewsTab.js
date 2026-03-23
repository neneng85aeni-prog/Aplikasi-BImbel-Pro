import { INITIAL_REVIEW_FORM } from '../../lib/constants'
import { formatMonthYear } from '../../lib/format'

export function ReviewsTab({ reviewForm, setReviewForm, users, reviews, onAddItem, onChangeItem, onRemoveItem, onSubmitReview, onPrintReview }) {
  return (
    <div className="grid grid-2">
      <div className="glass-card">
        <h2 className="section-title">Penilaian karyawan manual</h2>
        <form onSubmit={onSubmitReview}>
          <div className="form-row"><label>Karyawan</label><select value={reviewForm.user_id} onChange={(e) => setReviewForm({ ...reviewForm, user_id: e.target.value })}><option value="">Pilih karyawan</option>{users.map((item) => <option key={item.id} value={item.id}>{item.nama} • {item.akses}</option>)}</select></div>
          <div className="grid grid-2">
            <div className="form-row"><label>Bulan</label><input type="number" min="1" max="12" value={reviewForm.period_month} onChange={(e) => setReviewForm({ ...reviewForm, period_month: e.target.value })} /></div>
            <div className="form-row"><label>Tahun</label><input type="number" value={reviewForm.period_year} onChange={(e) => setReviewForm({ ...reviewForm, period_year: e.target.value })} /></div>
          </div>
          <div className="form-row"><label>Catatan umum</label><textarea value={reviewForm.notes} onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })} /></div>
          <div className="table-wrap"><table><thead><tr><th>Poin penilaian</th><th>Nilai</th><th>Catatan</th><th></th></tr></thead><tbody>{reviewForm.items.map((item, index) => <tr key={`${index}-${item.title}`}><td><input value={item.title} onChange={(e) => onChangeItem(index, 'title', e.target.value)} /></td><td><input type="number" min="0" max="10" value={item.score} onChange={(e) => onChangeItem(index, 'score', e.target.value)} /></td><td><input value={item.note} onChange={(e) => onChangeItem(index, 'note', e.target.value)} /></td><td><button className="btn btn-danger btn-small" type="button" onClick={() => onRemoveItem(index)}>Hapus</button></td></tr>)}</tbody></table></div>
          <div className="btn-row" style={{ marginTop: 12 }}><button className="btn btn-secondary" type="button" onClick={onAddItem}>+ Tambah poin</button><button className="btn btn-primary" type="submit">Simpan penilaian</button><button className="btn btn-secondary" type="button" onClick={() => setReviewForm(INITIAL_REVIEW_FORM)}>Reset</button></div>
        </form>
      </div>
      <div className="glass-card">
        <h2 className="section-title">Histori penilaian</h2>
        <div className="table-wrap"><table><thead><tr><th>Periode</th><th>Karyawan</th><th>Rata-rata</th><th>Catatan</th><th>Aksi</th></tr></thead><tbody>{reviews.map((item) => <tr key={item.id}><td>{formatMonthYear(item.period_month, item.period_year)}</td><td>{item.user?.nama || '-'}</td><td>{item.items?.length ? (item.items.reduce((sum, row) => sum + Number(row.score || 0), 0) / item.items.length).toFixed(1) : '0.0'}</td><td>{item.notes || '-'}</td><td><button className="btn btn-secondary btn-small" type="button" onClick={() => onPrintReview(item)}>Print</button></td></tr>)}</tbody></table></div>
      </div>
    </div>
  )
}
