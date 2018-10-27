require('dotenv').config()
var funcmatic = require('@funcmatic/funcmatic')
const Cognito = require('funcmatic-cognito')
var CognitoPlugin = require('../lib/cognito')

const EXPIRED_AUTH0_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9VUXdSRGhETXpZME5qTXhOa0ZHUWprelF6UXdOa0pETVRZMU0wUTBNa0pGUVRjNU5VSTFRZyJ9.eyJpc3MiOiJodHRwczovL2Z1bmNtYXRpYy5hdXRoMC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMTM2MjAxNTk3NjUzNTcxNTY4NTciLCJhdWQiOlsiaHR0cHM6Ly9mdW5jbWF0aWMuYXV0aDAuY29tL2FwaS92Mi8iLCJodHRwczovL2Z1bmNtYXRpYy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNTI3NTQ0OTA3LCJleHAiOjE1Mjc1NTIxMDcsImF6cCI6IjlCa0NuMndreXcxZ2NqVGt3RjYzcVMyaU9qV001a2VUIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCJ9.PvuKP_c1Fpaor9UvwyOf6pgSkylST-wdYR7zau-tF7kt6Gtb0u4MEs9hTr6ydMDyjpHAkhc6Tdumq_vvEJkVcwtIWzycSTwdW8IfhKUWai1Dh3w7ZnVtPqxWesmK5ny8ytw36Km0Yt_aOpNeyUNQ3JACLe9UuVuY8wDA9mJXGZDOi2zBu03hBA0NssgOTpzfx1L1IHqi5H8leaIeQ2AgXWgVXIuK81k6UKHgqOLbqnVSpU7yllxystTKqL6NrpZ1Qn4Vkt33df2GrjHaeipOpep_LXxFG2DZ2nN6vcyjEQIsY_7QO7p9JIq-u_zRKnGhFHL65bJeQI0sNipPb5NpnQ"
const EXPIRED_COGNITO_TOKEN = "eyJraWQiOiJVMmozN3pRMDlBMFdOWVM0Z2t1YWhwVzJRXC94amFIZ0hYRWFlMHAyMzBETT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIwZWRiMzE3Ni1lM2Q5LTQ1YWMtOGEyNi1iNmQ0M2NiMWY2ZDEiLCJhdWQiOiI1YTdyZ3Q0amNiZ3FqdTIwa25tdjVsdTE4OSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjFjYWYxNzZhLTY2ZTktMTFlOC04ZmM4LTIxYmJiMTA2NThmYiIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNTI4MDAxMjAzLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtd2VzdC0yLmFtYXpvbmF3cy5jb21cL3VzLXdlc3QtMl9lSlR3MmRzRlUiLCJjb2duaXRvOnVzZXJuYW1lIjoiMGVkYjMxNzYtZTNkOS00NWFjLThhMjYtYjZkNDNjYjFmNmQxIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiZGFuaWVsanlvbyIsImV4cCI6MTUyODAwNDgwMywiaWF0IjoxNTI4MDAxMjAzLCJlbWFpbCI6ImRhbmllbGp5b29AZ21haWwuY29tIn0.VwegW4bXu11vlnAWD0UT5SEfIZJnLQd0z2LSyECugiWl8nxOjz0KwDHj4Zs2o2MAEqDEowsUIJIVA5IfO9W9Zlay7_EPTktzAwXa6o8Sh5qEgDwd9B6dCH4a6nAudXOfEZX38jJbVvgJkmE9_xdWEG0XHt1Yl7w14ulBz8cFQp0qY8lgJxaCwRSpYdm5OFhi9NgTHzb0McLx93ty0EyPA3JTPBex-XpvpXiGyaY1sobNzj1NGVQROIju2zxSp96t2BckCavrG8NCNWoHi0jJu0iNv3LZxTB6F_34VzPY70Zj03yfuqKpqVLgUhgmZosUUDJsfo0DaARN1LESeECQzQ"

var cognito = null
var auth = null
var authtoken = null
beforeAll(async () => {
  cognito = new Cognito({
    UserPoolId: process.env.COGNITO_USERPOOLID, 
    ClientId: process.env.COGNITO_CLIENTID,
    IdentityPoolId: process.env.TEST_COGNITO_IDENTITYPOOLID
  })
  auth = await cognito.auth({
    Username: process.env.TEST_COGNITO_EMAIL,
    Password: process.env.TEST_COGNITO_PASSWORD
  })
  authtoken = auth.token
})

describe('Initialization', () => {
  it ('should create an cognito service using default env', async () => {
    expect(process.env.COGNITO_USERPOOLID).toBeTruthy()
    var newfunc = funcmatic.clone()
    newfunc.clear()
    newfunc.use(CognitoPlugin)
    var plugin = newfunc.getPlugin('cognito')
    expect(plugin.userPoolId).toBeFalsy() // it should not be initialized yet
    await newfunc.invoke({}, {}, async(event, context, { }) => {
      // noop
    })
    expect(plugin.userPoolId).toEqual(process.env.COGNITO_USERPOOLID)
    expect(plugin.cache).toEqual(process.env.COGNITO_REDIS_CACHE_CONNECTION == 'true')
    await newfunc.teardown()
  })
})

describe('Token Authentication', () => {
  var plugin = null
  beforeEach(() => {
    funcmatic.clear()
    funcmatic = funcmatic.clone()
    funcmatic.use(CognitoPlugin, {
      region: process.env.COGNITO_REGION,
      userPoolId: process.env.COGNITO_USERPOOLID,
      clientId: process.env.COGNITO_CLIENTID,
      uri: process.env.COGNITO_REDIS_ENDPOINT,
      password: process.env.COGNITO_REDIS_PASSWORD,
      cache: false
    })
    plugin = funcmatic.getPlugin('cognito')
  })
  afterEach(async () => {
    await funcmatic.teardown()
  })
  it ('should autofail non-cognito auth headers', async () => {
    var event = { headers: { 'Authorization': 'BadHeaderType My-Key0Value'} }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { cognito }) => {
      expect(cognito).toMatchObject({
        data: {
          auth: false
        }
      })
    })
  })
  it ('should create an cognito service', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { cognito }) => {
      expect(cognito).toBeTruthy()
    })
  })
  it ('should deny an expired Cognito Token', async () => {
    var event = { 
      headers: {
        Authorization: `Bearer ${EXPIRED_COGNITO_TOKEN}`
      }
    }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { cognito }) => {
      expect(cognito).toMatchObject({
        data: {
          auth: false
        }
      })
    })
  })
  it ("should auth a valid Cognito Token", async () => {
    var event = { 
      headers: {
        Authorization: `Bearer ${authtoken}`
      }
    }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { cognito }) => {
      expect(cognito).toMatchObject({
        data: {
          auth: true
        }
      })
    })
  })
  it ('should not cache the redis connection', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { cognito }) => {
      // noop
    })
    expect(plugin.isConnected()).toBeFalsy()
  })
})


describe('Caching Behavior', () => {
  var plugin = null
  beforeEach(() => {
    funcmatic.clear()
    funcmatic = funcmatic.clone()
    funcmatic.use(CognitoPlugin, {
      region: process.env.COGNITO_REGION,
      userPoolId: process.env.COGNITO_USERPOOLID,
      clientId: process.env.COGNITO_CLIENTID,
      uri: process.env.COGNITO_REDIS_ENDPOINT,
      password: process.env.COGNITO_REDIS_PASSWORD,
      cache: true
    })
    plugin = funcmatic.getPlugin('cognito')
  })
  afterEach(async () => {
    await funcmatic.teardown()
  })
  it ('should cache the Redis connection', async () => {
   var event = { 
      headers: {
        Authorization: `Bearer ${EXPIRED_COGNITO_TOKEN}`,
        'X-Funcmatic-Force-Authorization': 'true'
      }
    }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { cognito }) => {
      expect(cognito).toBeTruthy()
    })
    expect(plugin.isConnected()).toBeTruthy()
  })
  it ('should cache the token verification', async () => {
    var event = { 
      headers: {
        Authorization: `Bearer ${authtoken}`,
        'X-Funcmatic-Force-Authorization': 'true'
      }
    }
    var context = { }
    var cognito1 = null
    var cognito2 = null
    await funcmatic.invoke(event, context, async (event, context, { cognito }) => {
      expect(cognito).toMatchObject({
        report: {
          hit: false,
          force: true
        }
      })
      cognito1 = cognito
    })
    event.headers['X-Funcmatic-Force-Authorization'] = 'false'
    // this request should be cached
    await funcmatic.invoke(event, context, async (event, context, { cognito }) => {
      expect(cognito).toMatchObject({
        report: {
          hit: true
        }
      })
      cognito2 = cognito
    })
    expect(cognito1.t == cognito2.t).toBe(true)
    expect(cognito2.report.t < cognito1.report.t).toBe(true)
  })
}) 