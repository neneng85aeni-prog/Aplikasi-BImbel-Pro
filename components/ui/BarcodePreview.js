'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function BarcodePreview({ value, title = 'Barcode', compact = false }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let active = true
    if (!value) return
    QRCode.toDataURL(value, { margin: 1, width: compact ? 120 : 220 })
      .then((url) => {
        if (active) setSrc(url)
      })
      .catch(() => setSrc(''))
    return () => {
      active = false
    }
  }, [value, compact])

  if (!value) return null
  return (
    <div className="barcode-card">
      <div className="barcode-title">{title}</div>
      {src ? <img src={src} alt={value} className="barcode-image" /> : null}
      <div className="barcode-value">{value}</div>
    </div>
  )
}

export function printBarcodeCard({ title, value, subtitle = '' }) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px}.card{border:1px solid #d7dfef;border-radius:16px;padding:24px;max-width:420px}.title{font-size:20px;font-weight:700}.sub{margin:6px 0 16px;color:#4b5563}.value{font-size:18px;font-weight:600;word-break:break-all;margin-top:12px}.muted{color:#6b7280;font-size:12px;margin-top:10px}</style></head><body onload="window.print();window.close()"><div class="card"><div class="title">${title}</div><div class="sub">${subtitle}</div><div class="value">${value}</div><div class="muted">Print dari Bimbel Pro Enterprise Upgrade Besar</div></div></body></html>`
  const w = window.open('', '_blank', 'width=560,height=720')
  if (!w) return
  w.document.write(html)
  w.document.close()
}
