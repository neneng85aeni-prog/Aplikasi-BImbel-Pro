export function Banner({ warning = false, children }) {
  return <div className={`banner ${warning ? 'banner-warning' : ''}`}>{children}</div>
}
