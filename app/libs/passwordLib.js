const bcrypt = require('bcrypt')
const saltRounds = 10

const logger = require('./loggerLib')

let hashPassword = (myPassword) =>{
    let salt = bcrypt.genSaltSync(saltRounds)
    let hash = bcrypt.hashSync(myPassword, salt)
    return hash
} // end hash password

let comparePassword = (oldPassword, hashPassword, cb) =>{
    bcrypt.compare(oldPassword, hashPassword, (err, result)=>{
        if(err){
            logger.error(err.message, "password comparison", 10)
            cb(err, null)
        } else {
            cb(null, result)
        }
    })
} // end compare passwprd

let comparePasswordSync = (oldPassword, hashPassword)=>{
    return bcrypt.compareSync(oldPassword, hashPassword)
}

module.exports = {
    hashPassword: hashPassword,
    comparePassword: comparePassword,
    comparePasswordSync: comparePasswordSync
}