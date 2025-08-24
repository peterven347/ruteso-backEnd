require('dotenv').config()
const jwt = require("jsonwebtoken")

const socketAuth = (socket, next) => {
    try {
        if (socket.handshake.headers.cookie) {
            const token = socket.handshake.headers.cookie
            const auth = token.split("; ").find((cookie) => cookie.startsWith("session="))?.split("=")[1]
            jwt.verify(auth, process.env.ACCESS_TOKEN, (err, decoded) => {
                // if (err) console.log(err)
                if (err) socket.disconnect()
                socket.auth = decoded.email
            })
        }
        next()
    } catch (err) {
        console.log(err)
    }
}
module.exports = { socketAuth }