const jwt = require('jsonwebtoken')
const shortid = require('shortid')
const secretKey = "SomeRandomKey"

let generateToken = (data, cb) =>{
    try{
        let claims = {
            jwtid: shortid.generate(),
            iat: Date.now(),
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            sub: 'authToken',
            iss: 'edChat',
            data: data
        }

        let tokenDetails = {
            token: jwt.sign(claims, secretKey),
            tokenSecret: secretKey
        }
        cb(null, tokenDetails)
    } catch{
        console.log(err)
        cb(err, null)
    }
} // end generate token

let verifyToken = (token, secretKey, cb)=>{
    jwt.verify(token, secretKey, function(err, decoded){
        if(err){
            console.log(err)
            console.log("Error While verifying Token")
            cb(err, null)
        } else{
            console.log("Token verified")
            console.log(decoded)
            cb(null, decoded)
        }
    })
} // end verify claim

let verifyWithoutSecretKey = (token, cb)=>{
    jwt.verify(token, secretKey, function(err, decoded){
        if(err){
            console.log(err)
            console.log("Error While verifying Token")
            cb(err, null)
        } else{
            console.log("Token verified")
            cb(null, decoded)
        }
    })
}

module.exports = {
    generateToken: generateToken,
    verifyToken: verifyToken,
    verifyWithoutSecretKey: verifyWithoutSecretKey
}