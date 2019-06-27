const socketio = require('socket.io')
const mongoose = require('mongoose')
const shortid = require('shortid')
const events = require('events')
const eventEmitter = new  events.EventEmitter()
const ChatModel = mongoose.model('Chat')

const tokenLib = require('./tokenLib')
const check = require('./checkLib')
const response = require('./responseLib')
const logger = require('./loggerLib')

let setServer = (server) =>{

    let allOnlineUsers = []

    let io = socketio.listen(server) // used to create the connection

    let myIo = io.of('')

    myIo.on('connection', (socket)=>{
        console.log("on emitting --- verify user")

        socket.emit('verify-user', "")

        //code to verify user and make him online
        socket.on('set-user', (authToken)=>{
            console.log("set-user called")
            tokenLib.verifyWithoutSecretKey(authToken, (err, user)=>{
                if(err){
                    socket.emit('auth-error', {status: 500, error: "Please provide correct auth token"})
                } else {
                    console.log("user is verified..  setting details")
                    let currentUser = user.data
                    // setting socket user -id
                    socket.userId = currentUser.userId
                    let fullName = `${currentUser.firstName} ${currentUser.lastName}`
                    console.log(`${fullName} is online`)

                    let userObj = {userId: currentUser.userId, fullName: fullName}
                    allOnlineUsers.push(userObj)

                    //setting room name
                    socket.rooms = 'edChat'
                    //joining to group chat room
                    socket.join(socket.rooms)
                    socket.to(socket.rooms).broadcast.emit('online-user-list', allOnlineUsers)
                }
            })
        }) // end of - on set user

        socket.on('disconnect', ()=>{
            console.log("user is disconnected")
            console.log(socket.userId)

            var removeIndex = allOnlineUsers.map(function(user) {return user.userId}).indexOf(socket.userId)
            allOnlineUsers.splice(removeIndex, 1)
            console.log(allOnlineUsers)
            socket.to(socket.rooms).broadcast.emit('online-user-list', allOnlineUsers)
            socket.leave(socket.rooms)
        }) // end of - on disconnect

        socket.on('chat-msg', (data)=>{
            console.log("socket chat-msg called")
            console.log(data)
            console.log(data.receiverId)
            data['chatId']= shortid.generate()
            
            //event to save chat

            eventEmitter.emit('save-chat', data)  
            myIo.emit(data.receiverId, data)
        })
 
        socket.on('typing', (fullName)=>{
            socket.to(socket.rooms).broadcast.emit("typing", fullName)
        })

        eventEmitter.on('save-chat', (data)=>{
            
            let newChat = new ChatModel({
                chatId: data.chatId,
                senderName: data.senderName,
                senderId: data.senderId,
                receiverName: data.receiverName || '',
                receiverId: data.receiverId || '',
                message: data.message,
                chatRoom: data.chatRoom || '',
                createdOn: data.createdOn
            })

            newChat.save((err, result)=>{
                if(err){
                    console.log(`Error occured: ${err}`)
                } else if(result == undefined || result == null || result == ''){
                    console.log("No Chat message to be saved")
                } else {
                    console.log("Chat saved")
                    console.log(result)
                }
            })
        })
    }) // end socket connection
} // end set server

module.exports = {
    setServer: setServer
}
