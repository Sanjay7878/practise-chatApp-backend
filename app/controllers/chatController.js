const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const passwordLib = require('../libs/passwordLib')
const token = require('../libs/tokenLib')

const ChatModel = mongoose.model('Chat')

// function to get all user chats
let getUsersChat = (req, res)=>{
    let validateParams = () =>{
        return new Promise((resolve, reject)=>{
            if(check.isEmpty(req.query.senderId) || check.isEmpty(req.query.receiverId)){
                logger.error('Parameters Missing', "chatController: validateParams", 5)
                let apiResponse = response.generate(true, "Parameters Missing", 403, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    } // end validate params

    let findChats = () =>{
        return new Promise((resolve, reject)=>{
            let findQuery = {
                $or: [
                    {
                        $and:[
                            {senderId: req.query.senderId},
                            {receiverId: req.query.receiverId}
                        ]
                    },
                    {
                        $and:[
                            {receiverId: req.query.senderId},
                            {senderId: req.query.receiverId}
                        ]
                    }
                ]
            }

            ChatModel.find(findQuery)
                .select('-_id -__v -chatRoom')
                .sort('-createdOn')
                .skip(parseInt(req.query.skip) || 0)
                .lean()
                .limit(10)
                .exec((err, result)=>{
                    if(err){
                        console.log(err)
                        logger.error(err.message, "chatController: findChats", 6)
                        let apiResponse = response.generate(true, `error occured: ${err.message}`, 500, null)
                        reject(apiResponse)
                    } else if(check.isEmpty(result)){
                        logger.info('No Chat Found', "chatController: findChats", 5)
                        let apiResponse = response.generate(true, "No Chat Found", 404, null)
                        reject(apiResponse)
                    } else {
                        console.log("chat found and listed")
                        let reverseResult = result.reverse()
                        resolve(result)
                    }
                })
        })
    } // end find chats

    validateParams()
        .then(findChats)
        .then((resolve)=>{
            let apiResponse = response.generate(false, "Chats found", 200, resolve)
            res.send(apiResponse)
        })
        .catch((err)=>{
            console.log("Some error occured")
            console.log(err)
            res.send(err)
        })
} // end get users chat

//function to get all group chats
let getGroupChat = (req, res)=>{
    let validateParams = () =>{
        return new Promise((resolve, reject)=>{
            if(check.isEmpty(req.query.chatRoom)){
                logger.error('chatRoom parameter missing', "chatController: getGroupChats", 5)
                let apiResponse = response.generate(true, 'chatRoom parameter missing', 403, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    } // end validate params

    let findChats = () =>{
        let findQuery = {
            chatRoom: req.query.chatRoom
        }

        ChatModel.find(findQuery)
            .select('-_id -__v -receiverName -receiverId')
            .sort('-createdOn')
            .skip(parseInt(req.query.skip) || 0)
            .lean()
            .limit(10)
            .exec((err, result)=>{
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'Chat Controller: getUsersChat', 10)
                    let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
                    reject(apiResponse)
                  } else if (check.isEmpty(result)) {
                    logger.info('No Chat Found', 'Chat Controller: getUsersChat')
                    let apiResponse = response.generate(true, 'No Chat Found', 404, null)
                    reject(apiResponse)
                  } else {
                    console.log('chat found and listed.')
                    // reversing array.
                    let reverseResult = result.reverse()
                    resolve(result)
                  }
            })
    } // end find chats

    validateParams()
        .then(findChats)
        .then((resolve)=>{
            let apiResponse = response.generate(false, 'All Group Chats Listed', 200, result)
            res.send(apiResponse)
        })
        .catch((error) => {
            res.send(error)
        })
} // end get group chat

//function to mark chat as seen
let markAsSeen = (req, res)=>{

    let validateParams = () =>{
        return new Promise((resolve, reject)=>{
            if(check.isEmpty(req.query.chatIdCsv)){
                logger.error('parameters missing', 'chatController: markAsSeen', 5)
                let apiResponse = response.generate(true, 'parameters missing', 403, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    } // end validate params

    let modifyChat = ()=>{
        return new Promise((resolve, reject)=>{

            let findQuery = {
                chatId: req.query.chatIdCsv
            }

            let updateQuery = {
                seen: true
            }

            ChatModel.update(findQuery, updateQuery, {multi: true}, (err, result)=>{
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'Chat Controller: markChatAsSeen', 10)
                    let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
                    reject(apiResponse)
                } else if (result.n === 0) {
                    logger.info('No Chat Found', 'Chat Controller: markChatAsSeen')
                    let apiResponse = response.generate(true, 'No Chat Found', 404, null)
                    reject(apiResponse)
                } else {
                    console.log('chat found and updated.')
        
                    resolve(result)
                }
            })
        })
    } // end modify chat

    validateParams()
        .then(modifyChat)
        .then((resolve)=>{
            let apiResponse = response.generate(false, 'chat found and updated.', 200, result)
            res.send(apiResponse)
        })
        .catch((error) => {
            res.send(error)
        })
} // end mark as seen

//fucntion to get sount of unseen chats
let countUnSeenChat = (req, res) => {
    // function to validate params.
    let validateParams = () => {
      return new Promise((resolve, reject) => {
        if (check.isEmpty(req.query.userId)) {
          logger.info('parameters missing', 'countUnSeenChat handler', 9)
          let apiResponse = response.generate(true, 'parameters missing.', 403, null)
          reject(apiResponse)
        } else {
          resolve()
        }
      })
    } // end of the validateParams function.
  
    // function to get chats.
    let countChat = () => {
      return new Promise((resolve, reject) => {
        // creating find query.
        let findQuery = {}
  
        findQuery['receiverId'] = req.query.userId
        findQuery['seen'] = false
  
        if (check.isEmpty(req.query.senderId) === false) {
          findQuery['senderId'] = req.query.senderId
        }
  
        ChatModel.count(findQuery)
          .exec((err, result) => {
            if (err) {
              console.log(err)
              logger.error(err.message, 'Chat Controller: countUnSeenChat', 10)
              let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
              reject(apiResponse)
            } else {
              console.log('unseen chat count found.')
  
              resolve(result)
            }
          })
      })
    } // end of the countChat function.
  
    // making promise call.
    validateParams()
      .then(countChat)
      .then((result) => {
        let apiResponse = response.generate(false, 'unseen chat count found.', 200, result)
        res.send(apiResponse)
      })
      .catch((error) => {
        res.send(error)
      })
} // end count of unseen chat

//function to find all un seen chats
let findUnSeenChat = (req, res) => {
    // function to validate params.
    let validateParams = () => {
      return new Promise((resolve, reject) => {
        if (check.isEmpty(req.query.userId)) {
          logger.info('parameters missing', 'findUnSeenChat handler', 9)
          let apiResponse = response.generate(true, 'parameters missing.', 403, null)
          reject(apiResponse)
        } else {
          resolve()
        }
      })
    } // end of the validateParams function.
  
    // function to get chats.
    let findChats = () => {
      return new Promise((resolve, reject) => {
        // creating find query.
        let findQuery = {}
  
        findQuery['receiverId'] = req.query.userId
        findQuery['seen'] = false
  
        if (check.isEmpty(req.query.senderId) === false) {
          findQuery['senderId'] = req.query.senderId
        }
  
        ChatModel.find(findQuery)
          .select('-_id -__v')
          .sort('-createdOn')
          .skip(parseInt(req.query.skip) || 0)
          .lean()
          .limit(10)
          .exec((err, result) => {
            if (err) {
              console.log(err)
              logger.error(err.message, 'Chat Controller: findUnSeenChat', 10)
              let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
              reject(apiResponse)
            } else if (check.isEmpty(result)) {
              logger.info('No Chat Found', 'Chat Controller: findUnSeenChat')
              let apiResponse = response.generate(true, 'No Chat Found', 404, null)
              reject(apiResponse)
            } else {
              console.log('chat found and listed.')
  
              // reversing array.
              let reverseResult = result.reverse()
  
              resolve(result)
            }
          })
      })
    } // end of the findChats function.
  
    // making promise call.
    validateParams()
      .then(findChats)
      .then((result) => {
        let apiResponse = response.generate(false, 'chat found and listed.', 200, result)
        res.send(apiResponse)
      })
      .catch((error) => {
        res.send(error)
      })
} // end find un seen chat

//function to find user list of un seen chats
let findUserListOfUnseenChat = (req, res) => {
    console.log('--- inside findUserListOfChat function ---')
  
    // function to validate params.
    let validateParams = () => {
      return new Promise((resolve, reject) => {
        if (check.isEmpty(req.query.userId)) {
          logger.info('parameters missing', 'findUserListOfUnseenChat handler', 9)
          let apiResponse = response.generate(true, 'parameters missing.', 403, null)
          reject(apiResponse)
        } else {
          resolve()
        }
      })
    } // end of the validateParams function.
  
    // find distinct sender.
    let findDistinctSender = () => {
      return new Promise((resolve, reject) => {
        ChatModel.distinct('senderId', {receiverId: req.query.userId, seen: false})
          .exec((err, senderIdList) => {
            if (err) {
              console.log(err)
              logger.error(err.message, 'Chat Controller: findUserListOfUnseenChat', 10)
              let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
              reject(apiResponse)
            } else if (check.isEmpty(senderIdList)) {
              logger.info('No Unseen Chat User Found', 'Chat Controller: findUserListOfUnseenChat')
              let apiResponse = response.generate(true, 'No Unseen Chat User Found', 404, null)
              reject(apiResponse)
            } else {
              console.log('User found and userIds listed.')
  
              console.log(senderIdList)
  
              resolve(senderIdList)
            }
          })
      })
    } // find findDistinctSender function.
  
    // function to find user info.
    let findUserInfo = (senderIdList) => {
      return new Promise((resolve, reject) => {
        UserModel.find({userId: {$in: senderIdList}})
          .select('-_id -__v -password -email -mobileNumber')
          .lean()
          .exec((err, result) => {
            if (err) {
              console.log(err)
              logger.error(err.message, 'Chat Controller: findUserListOfUnseenChat', 10)
              let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
              reject(apiResponse)
            } else if (check.isEmpty(result)) {
              logger.info('No User Found', 'Chat Controller: findUserListOfUnseenChat')
              let apiResponse = response.generate(true, 'No User Found', 404, null)
              reject(apiResponse)
            } else {
              console.log('User found and userIds listed.')
  
              // console.log(result)
  
              resolve(result)
            }
          })
      })
    } // end of the findUserInfo function.
  
    // making promise call.
    validateParams()
      .then(findDistinctSender)
      .then(findUserInfo)
      .then((result) => {
        let apiResponse = response.generate(false, 'user found and listed.', 200, result)
        res.send(apiResponse)
      })
      .catch((error) => {
        res.send(error)
      })
} // end find user list of un seen chat

module.exports = {
    getUsersChat: getUsersChat,
    getGroupChat: getGroupChat,
    markAsSeen: markAsSeen,
    countUnSeenChat: countUnSeenChat,
    findUnSeenChat: findUnSeenChat,
    findUserListOfUnseenChat: findUserListOfUnseenChat
}