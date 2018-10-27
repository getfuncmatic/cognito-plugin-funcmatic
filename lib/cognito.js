//const auth = require('./auth')
const cache = require('./cache')
const redis = require('@funcmatic/simple-redis')

class CognitoPlugin {
  constructor() {
    this.name = 'cognito'
    this.cache = false
    this.cachedClient = null
  }
  
  async start(conf, env) {
    this.name == conf.name || this.name
    this.region = conf.region || env.COGNITO_REGION
    this.userPoolId = conf.userPoolId || env.COGNITO_USERPOOLID
    this.clientId = conf.clientId || env.COGNITO_CLIENTID
    // Redis Cache
    this.uri = conf.uri || env.COGNITO_REDIS_ENDPOINT
    this.password = conf.password || env.COGNITO_REDIS_PASSWORD
    if ('cache' in conf) {  // conf.cache could equal false
      this.cache = conf.cache
    } else {
      this.cache =  (env.COGNITO_REDIS_CACHE_CONNECTION && env.COGNITO_REDIS_CACHE_CONNECTION == 'true') || false
    }
  }
  
  async request(event, context) {
    var authorization = { data: { auth: false } }
    if (!event.headers || !isBearer(event.headers['Authorization'])) return { service: authorization }
    var force = false
    event.headers = event.headers || {} 
    var force = (event.headers['X-Funcmatic-Force-Authorization'] == 'true')
    var conn = await this.connect()
    authorization = await cache.verify(conn, stripBearer(event.headers['Authorization']), {
      region: this.region,
      userPoolId: this.userPoolId,
      clientId: this.clientId,
      force,
    })
    return { service: authorization }
  }

  async end(options) {
    if (options.teardown || !this.cache) {
      return await this.quit()
    }
  }

  isConnected() {
    return (this.conn && this.conn.client.connected)
  }
  
  async connect() {
    if (this.isConnected()) {
      return this.conn
    }
    this.conn = await redis.connect({
      uri: this.uri,
      password: this.password
    })
    return this.conn
  }

  async quit() {
    if (this.isConnected()) {
      await this.conn.quit()
      this.conn =  null
    }
    return true
  }
}

function isBearer(Authorization) {
  return Authorization && Authorization.startsWith('Bearer')
}

function stripBearer(Authorization) {
  if (isBearer(Authorization)) {
    return Authorization.split(' ')[1]
  }
  return Authorization
}

module.exports = CognitoPlugin

//   async authCache(token, force) {
//     var authorization = null
//     if (!this.cache) return await this.auth(token)
//     var expiration = this.conf.expiration || 1*60*60 // 1 hr
//     var client = await this.connectToRedis() 
//     if (!force) {
//       authorization = await client.get(token)
//       console.log("authorization", authorization)
//       if (authorization) return JSON.parse(authorization)
//     }
//     authorization = await this.auth(token)
//     console.log("JSON.stringify", JSON.stringify(authorization))
//     await client.set(token, JSON.stringify(authorization), 'EX', expiration)
//     return authorization
//   }
  
//   async auth(token) {
//     var user = null
//     if (!token) { 
//       return authorizationError(new Error("No token provided"))
//     }
//     try {
//       user = await this.client.users.getInfo(token)
//     } catch (err) {
//       return authorizationError(err)
//     }
//     if (typeof user == 'string') {
//       return authorizationError(new Error(user))
//     }
//     if (typeof user == 'object') {
//      return authorizationSuccess(user)
//     }
//     return authorizationError(new Error("Unknown response from Auth0"))
//   }
  
//   async connectToRedis() {
//     if (this.cache && this.cachedClient && this.cachedClient.client.connected) {
//       return this.cachedClient
//     }
//     this.cachedClient = await redis.connect({ 
//       uri: this.conf.redisEndpoint, 
//       password: this.conf.redisPassword 
//     })
//     return this.cachedClient
//   }

//   async disconnectFromRedis() {

//   }
// }

// function stripBearer(Authorization) {
//   if (Authorization && Authorization.startsWith('Bearer')) {
//     return Authorization.split(' ')[1]
//   }
//   return Authorization
// }

// function authorizationSuccess(user) {
//   return {
//     authorized: true,
//     authorized_at: (new Date()).getTime(),
//     user
//   }
// }

// function authorizationError(err) {
//   return {
//     authorized: false,
//     authorized_at: (new Date()).getTime(),
//     error: true,
//     errorMessage: err.message
//   }
// }

// class A {
//   constructor(fooVal) {
//     this.foo = fooVal;
//   }
// }

// class AFactory {
//   static async create() {
//     return new A(await Promise.resolve('fooval'));
//   }
// }

// (async function generate() {
//   const aObj = await AFactory.create();
//   console.log(aObj);
// })()