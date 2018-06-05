const endtimeOfIco = new Date('2018-04-03T11:00:00+07:00')
const closeIco = new Date('2018-03-31T23:59:59+07:00')
//const endtimeOfIco = new Date('2018-01-03T10:00:00+07:00')
var domain = window.location.href
let appId, pageId
if (domain.match('localhost')) {
   appId = null
   pageId = null
} else if (domain.match('six-dashboard')) {
   appId = '213862799361066'
   pageId = '233986130671718'
} else if (domain.match('ico.six.network')) {
   appId = '1182285935241952'
   pageId = '912541605588613'
} else {
   appId = '213862799361066'
   pageId = '233986130671718'
}
