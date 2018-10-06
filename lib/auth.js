const axios = require('axios')
const jose = require('node-jose')
const jwtDecode = require('jwt-decode')

module.exports = {
  keys,
  decode,
  verify
}

async function verify(token, options) {
  if (!token) {
    return {
      auth: false,
      message: "Authorization token not provided"
    }
  }
  var clientId = options.clientId
  var publickeys = await keys(options)
  var { header, payload } = decode(token)
  var key = findInPublicKeys(publickeys, header.kid) 
  if (!key) {
    return {
      auth: false,
      t: (new Date()).getTime(),
      message: "Public key not found in jwks.json"
    }
  }
  var joseVerify = jose.JWS.createVerify(await jose.JWK.asKey(key))
  var result = await joseVerify.verify(token)
  // now we can use the claims
  var claims = JSON.parse(result.payload)
  if (isExpired(claims) && !options.skipExpirationCheck) {
    return {
      auth: false,
      t: (new Date()).getTime(),
      message: "Token is expired",
      claims
    }
  }

  // and the Audience (use claims.client_id if verifying an access token)
  if (claims.aud != clientId) {
    return {
      auth: false,
      t: (new Date()).getTime(),
      message: "Token was not issued for this audience",
      claims
    }
  }
  return {
    auth: true,
    t: (new Date()).getTime(),
    claims
  }
}

async function keys(options) {
  var keys_url = `https://cognito-idp.${options.region}.amazonaws.com/${options.userPoolId}/.well-known/jwks.json`
  var clientId = options.clientId
  var data = (await axios.get(keys_url)).data
  return data.keys
}

function decode(token) {
  try {
    var payload =  jwtDecode(token)
    var header = jwtDecode(token, { header: true })
    return { header, payload }
  } catch (err) {
    console.error("Error decoding jwt token", err)
    return null
  }
}



function findInPublicKeys(keys, kid) {
  for (var key of keys) {
    if (key.kid == kid) {
      return key
    }
  }
  return false
}

function isExpired(claims, t) {
  if (!t) t = new Date()
  var current_ts = Math.floor(t / 1000);
  return (current_ts > claims.exp) 
}

// AWS Cognito JWT decoded

// {
//   "sub": "aaaaaaaa-bbbb-cccc-dddd-example",
//   "aud": "xxxxxxxxxxxxexample",
//   "email_verified": true,
//   "token_use": "id",
//   "auth_time": 1500009400,
//   "iss": "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_example",
//   "cognito:username": "anaya",
//   "exp": 1500013000,
//   "given_name": "Anaya",
//   "iat": 1500009400,
//   "email": "anaya@example.com"
// }

// {
//   "aud": "5a7rgt4jcbgqju20knmv5lu189", 
//   "auth_time": 1528001203, 
//   "cognito:username": "0edb3176-e3d9-45ac-8a26-b6d43cb1f6d1", 
//   "email": "danieljyoo@gmail.com", 
//   "email_verified": true, 
//   "event_id": "1caf176a-66e9-11e8-8fc8-21bbb10658fb", 
//   "exp": 1528004803, 
//   "iat": 1528001203, 
//   "iss": "https://cognito-idp.us-west-2.amazonaws.com/us-west-2_eJTw2dsFU", 
//   "preferred_username": "danieljyoo", 
//   "sub": "0edb3176-e3d9-45ac-8a26-b6d43cb1f6d1", 
//   "token_use": "id"
// }

// https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json

// https://github.com/awslabs/aws-support-tools/tree/master/Cognito/decode-verify-jwt


// https://github.com/awslabs/aws-support-tools/tree/master/Cognito/decode-verify-jwt
// #jwks.json

// {
//     "keys": [{
//         "alg": "RS256",
//         "e": "AQAB",
//         "kid": "abcdefghijklmnopqrsexample=",
//         "kty": "RSA",
//         "n": "lsjhglskjhgslkjgh43lj5h34lkjh34lkjht3example",
//         "use": "sig"
//     }, {
//         "alg":
//         "RS256",
//         "e": "AQAB",
//         "kid": "fgjhlkhjlkhexample=",
//         "kty": "RSA",
//         "n": "sgjhlk6jp98ugp98up34hpexample",
//         "use": "sig"
//     }]
// }

// var https = require('https');
// var jose = require('node-jose');

// var region = 'ap-southeast-2';
// var userpool_id = 'ap-southeast-2_xxxxxxxxx';
// var app_client_id = '<ENTER APP CLIENT ID HERE>';
// var keys_url = 'https://cognito-idp.' + region + '.amazonaws.com/' + userpool_id + '/.well-known/jwks.json';

// exports.handler = (event, context, callback) => {
//     var token = event.token;
//     var sections = token.split('.');
//     // get the kid from the headers prior to verification
//     var header = jose.util.base64url.decode(sections[0]);
//     header = JSON.parse(header);
//     var kid = header.kid;
//     // download the public keys
//     https.get(keys_url, function(response) {
//         if (response.statusCode == 200) {
//             response.on('data', function(body) {
//                 var keys = JSON.parse(body)['keys'];
//                 // search for the kid in the downloaded public keys
//                 var key_index = -1;
//                 for (var i=0; i < keys.length; i++) {
//                         if (kid == keys[i].kid) {
//                             key_index = i;
//                             break;
//                         }
//                 }
//                 if (key_index == -1) {
//                     console.log('Public key not found in jwks.json');
//                     callback('Public key not found in jwks.json');
//                 }
//                 // construct the public key
//                 jose.JWK.asKey(keys[key_index]).
//                 then(function(result) {
//                     // verify the signature
//                     jose.JWS.createVerify(result).
//                     verify(token).
//                     then(function(result) {
//                         // now we can use the claims
//                         var claims = JSON.parse(result.payload);
//                         // additionally we can verify the token expiration
//                         current_ts = Math.floor(new Date() / 1000);
//                         if (current_ts > claims.exp) {
//                             callback('Token is expired');
//                         }
//                         // and the Audience (use claims.client_id if verifying an access token)
//                         if (claims.aud != app_client_id) {
//                             callback('Token was not issued for this audience');
//                         }
//                         callback(null, claims);
//                     }).
//                     catch(function() {
//                         callback('Signature verification failed');
//                     });
//                 });
//             });
//         }
//     });
// }