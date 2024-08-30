const jwt = require("jsonwebtoken")
function auth(req, res, next) {
    try {
        let decodedToken;
        const authHeader = req.get("Authorization")
        if (!authHeader) {
            // res.send("<h1>No valid token detected, Login!!</h1>")
            return res.redirect("http://localhost:3000");
        } else {
            const token = authHeader.split(" ")[1]
            decodedToken = jwt.verify(token, "mysupersecrettoken")
            
            if (!decodedToken) {
                req.auth = { valid: false }
                return res.redirect("http://localhost:3000");
            }
            req.auth = { valid: true, email: decodedToken.email }
        }
        next()
    } catch (err) {
        // res.json({message: "Authentication error!"})
    }
}

module.exports = {
    auth
}