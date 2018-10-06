const auth = require('./auth')
const DEFAULT_EXPIRE_SECONDS = 60

module.exports = {
  verify
}

async function verify(conn, token, options) {
  var hit = true
  var t1 = (new Date()).getTime()
  var report = { }
  if (!token) {
    // return whatever auth returns for empty token
    var data = await auth.verify(token, options)
    return { data, report }
  }
  var data = await conn.get(token)
  if (options.force || !data) {
    hit = false
    authdata = await auth.verify(token, options)
    data = JSON.stringify(authdata)
    await conn.set(token, data, 'EX', expireSeconds(authdata))
  }
  var t2 = (new Date()).getTime()
  report.t = t2 - t1
  report.hit = hit
  report.force = options.force
  return { data: JSON.parse(data), report }
}

function expireSeconds(authdata) {
  if (!authdata.auth) {
    return DEFAULT_EXPIRE_SECONDS
  }
  var t = Math.floor((new Date()).getTime() / 1000)
  return (authdata.claims.exp - t)
}
