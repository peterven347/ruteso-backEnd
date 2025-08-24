const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser')
const tt = cookieParser()

function auth(req, res, next) {
    try {
        const token = req.cookies.session
        if (!token) return res.json({success: false, message: "no auth"})
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN)
        if (!decodedToken) return res.json({success: false, message: "token error"})
        req.auth = { success: true, email: decodedToken.email }
        next()
    } catch (err) {
        return res.json({success: false, message: "authentication error"})
    }
}

module.exports = {
    auth
}