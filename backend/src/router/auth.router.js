const authRouter = require("express").Router();

const authController = require("../controllers/auth.controller");

//auth routes
authRouter.post("/register", authController.register);

//login
authRouter.post("/login", authController.login);

module.exports = authRouter;
