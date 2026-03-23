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

export async function printBarcodeCard({ title, value, subtitle = '' }) {
  const qr = await QRCode.toDataURL(value, {
    margin: 1,
    width: 256,
  })

  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      @page {
        size: 4cm 4cm;
        margin: 0;
      }

      body {
        margin: 0;
        padding: 0;
        width: 4cm;
        height: 4cm;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial;
        background: #fff;
      }

      .card {
        width: 4cm;
        height: 4cm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .title {
        font-size: 10px;
        font-weight: bold;
        text-align: center;
      }

      .sub {
        font-size: 8px;
        text-align: center;
        margin-bottom: 4px;
      }

      img {
        width: 2.6cm;
        height: 2.6cm;
      }

      .value {
        font-size: 7px;
        text-align: center;
        margin-top: 4px;
        word-break: break-all;
      }
    </style>
  </head>
  <body onload="window.print();window.close()">
    <div class="card">
      <div class="title">${title}</div>
      <div class="sub">${subtitle}</div>
      <img src="${qr}" />
      <div class="value">${value}</div>
    </div>
  </body>
  </html>

  const w = window.open('', '_blank', 'width=400,height=400')
  if (!w) return

  w.document.write(html)
  w.document.close()
}
