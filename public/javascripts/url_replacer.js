$(document).ready(function () {
  let all_a = $('a')
  for(let i = 0; i < all_a.length; i++) {
    let this_a = all_a[i]
    if (/#/.test(this_a.href) != true && /javascript/.test(this_a.href) != true && (this_a.href.match(window.location.hostname) != null || this_a.href.match('six.network') != null || this_a.href.match('ico.six.network') != null || /^\//.test(this_a.href))) {
      if (/\?/.test(this_a.href)) {
        this_a.href = this_a.href + "&" + window.location.search.substring(1)
      } else {
        this_a.href = this_a.href + "?" + window.location.search.substring(1)
      }
    }
  }
})
