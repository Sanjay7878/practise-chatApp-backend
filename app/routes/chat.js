const express = require('express');
const chatController = require("./../../app/controllers/chatController");
const appConfig = require("./../../config/appConfig")
const auth = require('./../middlewares/auth')

module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/chat`

    // params: senderId, receiverId, skip.
    app.get(baseUrl+'/get/all/chats',auth.isAuthorized, chatController.getUsersChat)
    /**
    * @apiGroup chat
    * @apiVersion  1.0.0
    * @api {get} /api/v1/chat/get/all/chats to get paginated chats of user.
    * 
    * @apiParam {string} senderId userId of logged in user. (query params) (required)
    * @apiParam {string} receiverId userId receiving user. (query params) (required)
    * @apiParam {number} skip skip value for pagination. (query params) (optional)
    *
    * @apiSuccess {object} myResponse shows error status, message, http status code, result.
    * 
    * @apiSuccessExample {object} Success-Response:
        {
            "error": false,
            "message": "All Chats Listed",
            "status": 200,
            "data": [
            {
                "chatId": "IELO6EVjx",
                "modifiedOn": "2018-03-05T15:36:31.026Z",
                "createdOn": "2018-03-05T15:36:31.025Z",
                "message": "hello .. .. sourav",
                "receiverId": "-E9zxTYA8",
                "receiverName": "Rishabh Sengar",
                "senderId": "-cA7DiYj5",
                "senderName": "sourav das"
            },
            {
                "chatId": "ZcaxtEXPT",
                "modifiedOn": "2018-03-05T15:36:39.548Z",
                "createdOn": "2018-03-05T15:36:39.547Z",
                "message": "hello rishabh .. .. .. ",
                "receiverId": "-cA7DiYj5",
                "receiverName": "sourav das",
                "senderId": "-E9zxTYA8",
                "senderName": "Rishabh Sengar"
            },
            .........................
            ]

        }
    */

    // params: chatRoom, skip.
    app.get(baseUrl+'/get/group/chats',auth.isAuthorized, chatController.getGroupChat)
    
    // params: chatIdCsv.
    app.post(baseUrl+'/mark/as/seen',auth.isAuthorized, chatController.markAsSeen)
    
    // params: userId, senderId.
    app.get(baseUrl+'/count/of/unseen',auth.isAuthorized, chatController.countUnSeenChat)

    // params: userId, senderId, skip.
    app.get(baseUrl+'/unseen/chats',auth.isAuthorized, chatController.findUnSeenChat)
    
    // params: userId.
    app.get(baseUrl+'/unseen/users',auth.isAuthorized, chatController.findUserListOfUnseenChat)
}