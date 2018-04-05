var domain = window.location.href
var googleId = ''

if (domain.match('localhost')) {
  googleId = 'UA-58954565-1'
} else if (domain.match('six-dashboard')) {
  googleId = 'UA-116980354-1'
} else if (domain.match('ico.six.network')) {
  googleId = 'UA-116935621-1'
}

if (googleId != '') {
  var s = document.createElement('script')
  s.type = 'text/javascript'
  s.src = `https://www.googletagmanager.com/gtag/js?id=${googleId}`
  s.async = ' '
  document.head.appendChild(s)

  var script = document.createElement('script')
  script.innerHTML = `
  window.dataLayer = window.dataLayer || []
  function gtag () {
    dataLayer.push(arguments)
  }
  gtag('js', new Date())
  gtag('config', googleId)
  `
  document.head.appendChild(script)
}
