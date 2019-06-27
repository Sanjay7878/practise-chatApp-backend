const express = require('express');
const router = express.Router();
const userController = require("./../../app/controllers/userController");
const appConfig = require("./../../config/appConfig")

module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/users`;

    // defining routes.


    // params: firstName, lastName, email, mobileNumber, password
    app.post(`${baseUrl}/signup`, userController.signUpFunction);

    /**
     * @apiGroup users
     * @apiVersion  1.0.0
     * @api {post} /api/v1/users/login api for user login.
     *
     * @apiParam {string} email email of the user. (body params) (required)
     * @apiParam {string} password password of the user. (body params) (required)
     *
     * @apiSuccess {object} myResponse shows error status, message, http status code, result.
     * 
     * @apiSuccessExample {object} Success-Response:
         {
            "error": false,
            "message": "Login Successful",
            "status": 200,
            "data": {
                "authToken": "eyJhbGciOiJIUertyuiopojhgfdwertyuVCJ9.MCwiZXhwIjoxNTIwNDI29tIiwibGFzdE5hbWUiE4In19.hAR744xIY9K53JWm1rQ2mc",
                "userDetails": {
                "mobileNumber": 2234435524,
                "email": "someone@mail.com",
                "lastName": "Sengar",
                "firstName": "Rishabh",
                "userId": "-E9zxTYA8"
            }

        }
    */

    // params: email, password.
    app.post(`${baseUrl}/login`, userController.loginFunction);

    /**
     * @apiGroup users
     * @apiVersion  1.0.0
     * @api {post} /api/v1/users/logout to logout user.
     *
     * @apiParam {string} userId userId of the user. (auth headers) (required)
     *
     * @apiSuccess {object} myResponse shows error status, message, http status code, result.
     * 
     * @apiSuccessExample {object} Success-Response:
         {
            "error": false,
            "message": "Logged Out Successfully",
            "status": 200,
            "data": null

        }
    */

    // auth token params: userId.
    app.post(`${baseUrl}/logout`, userController.logout);

    app.get(`${baseUrl}/all`, userController.getAllUserDetails)

    /**
     * @api {get} /api/v1/users/all Get All User Details
     * @apiVersion 0.0.1
     * @apiGroup View
     * 
     * @apiParam {String} authToken The token for authentication
     * 
        * @apiSuccessExample {json} Success-Response:
        * {
        * "error": false,
        * "message": "All Users found",
        * "status": 200,
        * "data": [
        *           {
        *               "authToken": "eyJhbGciOiJIUertyuiopojhgfdwertyuVCJ9.MCwiZXhwIjoxNTIwNDI29tIiwibGFzdE5hbWUiE4In19.hAR744xIY9K53JWm1rQ2mc",
                        "userDetails": 
                            {
                                "mobileNumber": 2234435524,
                                "email": "someone@mail.com",
                                "lastName": "Sengar",
                                "firstName": "Rishabh",
                                "userId": "-E9zxTYA8"
        *           }       }
        *         ]
        * }
        * 
        * @apiErrorExample {json} Error-Response:
        * 
        * {
        * "error": true,
        * "message": "No User found",
        * "status": 404,
        * "data": null
        * }
     */
    app.get(`${baseUrl}/:userId/user`, userController.getSingleUser)
    app.post(`${baseUrl}/:userId/user/delete`, userController.deleteUser)
    app.put(`${baseUrl}/:userId/edit/user`, userController.editUser)

}
