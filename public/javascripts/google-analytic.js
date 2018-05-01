var domain = window.location.href
var googleId = ''

if (domain.match('localhost')) {
  googleId = 'UA-58954565-1'
} else if (domain.match('six-dashboard')) {
  googleId = 'UA-116980354-1'
} else if (domain.match('ico.six.network')) {
  googleId = 'UA-116085165-1'
}

if (googleId != '') {
  var s = document.createElement('script')
  s.type = 'text/javascript'
  s.src = `https://www.googletagmanager.com/gtag/js?id=${googleId}`
  s.async = ' '
  document.head.appendChild(s)

  var script = document.createElement('script')
  script.innerHTML = `
    (function(i,s,o,g,r,a,m){
      i['GoogleAnalyticsObject']=r;
      i[r]=i[r] || function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();
        a=s.createElement(o), m=s.getElementsByTagName(o)[0];
        a.async=1;
        a.src=g;
        m.parentNode.insertBefore(a,m)
    })
    (window,document,'script','https://www.google-analytics.com/analytics.js','ga');
    ga('create', googleId, 'auto');
    ga('send', 'pageview');
    window.dataLayer = window.dataLayer || [];
    function gtag () {
      dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', googleId);
    gtag('config', 'GTM-N5DKTMD');
  `
  document.head.appendChild(script)
}
