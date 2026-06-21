// Shared handle to the Lenis instance so any component can request a smooth
// scroll without prop-drilling. Falls back to native smooth scroll.
let _lenis = null

export const setLenis = (l) => {
  _lenis = l
}

export const scrollToEl = (el, opts = {}) => {
  if (!el) return
  if (_lenis) {
    _lenis.scrollTo(el, { offset: -88, duration: 1.0, ...opts })
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
