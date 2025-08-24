require('dotenv').config()
const jwt = require("jsonwebtoken")

const revoked_access_tokens = [] //will take up memory over time

function auth(req, res, next) {
    try {
        // const authHeader = req.get("Authorization")
        // if (!authHeader) {
        //     req.auth = { message: "no auth" }
        //     return res.json(req.auth)
        // }

        // const token = authHeader.split(" ")[1]
        // const revoked = authHeader.split(" ")[2] === "exp"
        // if (revoked_access_tokens.includes(token)) {
        //     req.auth = { exp: "revoked" }
        //     return res.json(req.auth)
        // }

        // jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        //     console.log(req.method, req.path)
        //     if (err) {
        //         if (err.name === "TokenExpiredError") {
        //             req.auth = { exp: true }
        //             return res.json(req.auth)
        //         }
        //         req.auth = { exp: "invalid token" }
        //         console.log(1111)
        //         return res.json(req.auth)
        //     } else if (revoked) {
        //         console.log(1)
        //         revoked_access_tokens.push(token)
        //         req.auth = { exp: true }
        //         return res.json(req.auth)
        //     } else {
        //         console.log(2)
        //         req.auth = { email: user.email }
        //         next()
        //     }
        // })
        req.auth ={email: "peter@gmail.com"}
        next()
    } catch (err) {
        req.auth = { message: "Authentication error!" }
    }
}

function refreshAuth(req, res, next) {
    try {
        const authHeader = req.get("Authorization")
        if (!authHeader) {
            return res.json({ message: "no auth" })
        }

        const token = authHeader.split(" ")[1]
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                console.log(err.name)
                if (err.name === "TokenExpiredError") {
                    next()
                } else {
                    console.log("not proceeding...")
                }
            }
        })
    } catch (err) {
        console.log(err)
        // res.json()
    }
}

module.exports = { auth, refreshAuth }