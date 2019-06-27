const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const passwordLib = require('../libs/passwordLib')
const token = require('../libs/tokenLib')

/* Models */
const UserModel = mongoose.model('User')
const AuthModel = mongoose.model('Auth')

// start user signup function 

let signUpFunction = (req, res) => {

    let validateUserInput =() => {
        return new Promise((resolve, reject)=>{
            if(req.body.email){
                if(!validateInput.Email(req.body.email)){
                    let apiResponse = response.generate(true, "Email address does not meet the requirement", 400, null)
                    reject(apiResponse)
                } else if(check.isEmpty(req.body.password)){
                    let apiResponse = response.generate(true, "Password parameter is missing", 400, null)
                    reject(apiResponse)
                } else {
                    resolve(req)
                }
            } else {
                logger.error("Required Field Info is missing", "userController: validateUser", 10)
                let apiResponse = response.generate(true, "One or More parameters are missing", 400, null)
                reject(apiResponse)
            }
        })
    } // end validate user input

    let createUser = () =>{
        return new Promise((resolve, reject)=>{
            UserModel.findOne({email: req.body.email.toLowerCase()})
                .exec((err, retrivedUserData)=>{
                    if(err){
                        logger.error(err.message, "userController: createUser", 10)
                        let apiResponse = response.generate(true, "Failed to create user", 500, null)
                        reject(apiResponse)
                    } else if(check.isEmpty(retrivedUserData)){
                        console.log(retrivedUserData)
                        let newUser = new UserModel({
                            userId: shortid.generate(),
                            firstName: req.body.firstName,
                            lastName: req.body.lastName || '',
                            password: passwordLib.hashPassword(req.body.password),
                            email: req.body.email.toLowerCase(),
                            mobileNumber: req.body.mobileNumber,
                            createdOn: time.now()
                        })

                        newUser.save((err, newUser)=>{
                            if(err){
                                console.log(err)
                                logger.error(err, "userController: createUser", 10)
                                let apiResponse = response.generate(true, "Failed to create user", 500, null)
                                reject(apiResponse)
                            } else {
                                let newUserObj = newUser.toObject()
                                resolve(newUserObj)
                            }
                        })
                    } else {
                        logger.error("User Cannot be created. User Already Present", "userController: createUser", 10)
                        let apiResponse = response.generate(true, "User Already Present with this email", 403, null)
                        reject(apiResponse)
                    }
                })
        })
    } // end create user

    validateUserInput(req, res)
        .then(createUser)
        .then((resolve)=>{
            delete resolve.password
            let apiResponse = response.generate(false, "User Created Succesfully", 200, resolve)
            res.send(apiResponse)
        })
        .catch((err)=>{
            console.log(err)
            res.send(err)
        })
  
}// end user signup function 

// start of login function 
let loginFunction = (req, res) => {

    let findUser = () =>{
        return new Promise((resolve, reject)=>{
            if(req.body.email){
                UserModel.findOne({email: req.body.email}, (err, userDetails)=>{
                    if(err){
                        logger.error(err, "userController: finduser", 10)
                        let apiResponse = response.generate(true, "Failed to Retrive User Details", 500, null)
                        reject(apiResponse)
                    } else if(check.isEmpty(userDetails)){
                        logger.error("No User Found", "userController: findUser", 10)
                        let apiResponse =response.generate(true, "No User Details Found", 404, null)
                        reject(apiResponse)
                    } else {
                        logger.info("User Found", "userController: findUser", 10)
                        resolve(userDetails)
                    }
                })
            } else {
                logger.error("Email Address is missing", "userController: findUser", 10)
                let apiResponse = response.generate(true, "Email parameter is missing", 400, null)
                reject(apiResponse)
            }
        })
    } // end find user

    let validatePassword = (retrivedUserData) =>{
        return new Promise((resolve, reject)=>{
            passwordLib.comparePassword(req.body.password, retrivedUserData.password, (err, isMatch)=>{
                if(err){
                    logger.error(err.message, " userController: validatePassword", 10)
                    let apiResponse = response.generate(true, "Login Failed", 500, null)
                    reject(apiResponse)
                }else if(isMatch){
                    let retrivedUserDataObj = retrivedUserData.toObject()
                        delete retrivedUserDataObj.password
                        delete retrivedUserDataObj._id
                        delete retrivedUserDataObj.__v
                        delete retrivedUserDataObj.createdOn
                        resolve(retrivedUserDataObj)
                } else {
                    logger.error("Invalid Password", "userController: validatePassword", 10)
                    let apiResponse = response.generate(true, "Invalid Password", 403, null)
                    reject(apiResponse)
                }
            })
        })
    } // end validate password

    let generateToken = (userDetails) =>{
       // console.log(JSON.stringify(userDetails)  + "\n\n\ngenerate Token")
        return new Promise((resolve, reject)=>{
            token.generateToken(userDetails, (err, tokenDetails)=>{
                if(err){
                    logger.error(err.message, "userController: generateToken", 6)
                    let apiResponse = response.generate(true, "Failed to generate Token", 500, null)
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(tokenDetails)
                }

            })
        })
    } // end generate Token

    let saveToken = (tokenDetails) =>{
        return new Promise((resolve, reject)=>{
            AuthModel.findOne({userId: tokenDetails.userId}, (err, retreivedTokenDetails)=>{
                if(err){
                    logger.error(err.message, "userController: saveToken", 6)
                    let apiResponse = response.generate(true, "Failed to Generate Token Details", 500, null)
                    reject(apiResponse)
                } else if(check.isEmpty(retreivedTokenDetails)){

                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.token,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    })
                    newAuthToken.save((err, newTokenDetails)=>{
                        if(err){
                            logger.error(err.message, "userController: saveToken", 6)
                            let apiResponse = response.generate(true, "Failed to Generate Token Details", 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                } else {
                    retreivedTokenDetails.authToken = tokenDetails.token
                    retreivedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retreivedTokenDetails.tokenGenerationTime = time.now()

                    retreivedTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
            })
        })
    } // end save token

    findUser(req,res)
        .then(validatePassword)
        .then(generateToken)
        .then(saveToken)
        .then((resolve)=>{
            console.log("Login Successful")
            let apiResponse = response.generate(false, "Login Successful", 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err)=>{
            console.log(err)
            console.log("Error while login")
            res.status(err.status)
            res.send(err)
        })

} // end of the login function 


let logout = (req, res) => {
  
} // end of the logout function.

let getAllUserDetails = (req, res)=>{
    UserModel.find()
        .select('-__v -_id')
        .lean()
        .exec((err, result)=>{
            if (err) {
                console.log(err)
                logger.error(err.message, 'User Controller: getAllUser', 10)
                let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'User Controller: getAllUser')
                let apiResponse = response.generate(true, 'No User Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'All User Details Found', 200, result)
                res.send(apiResponse)
            }
        })
} // end get all user details

let getSingleUser = (req,res)=>{
    UserModel.findOne({userId: req.params.userId}, (err, result)=>{
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller: getSingleUser', 10)
            let apiResponse = response.generate(true, 'Failed To get user details', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: getSingleUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'User Found', 200, result)
            res.send(apiResponse)
        }
    })
} // end get single user 

let deleteUser = (req, res)=>{
    UserModel.deleteOne({userId : req.params.userId}, (err, result)=>{
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller: deleteUser', 10)
            let apiResponse = response.generate(true, 'Failed To delete user', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: deleteUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'Deleted the user successfully', 200, result)
            res.send(apiResponse)
        }
    })
} // end delete user

let editUser = (req, res)=>{
    let options = req.body
    UserModel.update({"userId": req.params.userId}, options, {multi: true}, (err, result)=>{
        if (err) {
            console.log(err)
            logger.error(err.message, 'User Controller: editUser', 10)
            let apiResponse = response.generate(true, 'Failed To Edit User Details', 500, null)
            res.send(apiResponse)
        } else if (check.isEmpty(result)) {
            logger.info('No User Found', 'User Controller: editUser')
            let apiResponse = response.generate(true, 'No User Found', 404, null)
            res.send(apiResponse)
        } else {
            let apiResponse = response.generate(false, 'User Details Edited successfully', 200, result)
            res.send(apiResponse)
        }
    })
} // end edit user

module.exports = {

    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logout: logout,
    getAllUserDetails: getAllUserDetails,
    getSingleUser: getSingleUser,
    deleteUser: deleteUser,
    editUser: editUser

}// end exports