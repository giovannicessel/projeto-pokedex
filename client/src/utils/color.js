/** @param {string} hex #RRGGBB */
export function hexToRgb(hex) {
  const h = hex.replace('#', '').slice(0, 6)
  if (h.length !== 6) return { r: 100, g: 100, b: 100 }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/** Fundo sutil: opacidade baixa para o GIF não “sumir” no vermelho etc. */
export function typeSurfaceStyle(hex, mode) {
  const { r, g, b } = hexToRgb(hex)
  const alpha = mode === 'dark' ? 0.14 : 0.1
  const alpha2 = mode === 'dark' ? 0.06 : 0.05
  return {
    background: `linear-gradient(180deg, rgba(${r},${g},${b},${alpha}) 0%, rgba(${r},${g},${b},${alpha2}) 100%)`,
  }
}
