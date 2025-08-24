require("dotenv/config")
const cookieParser = require('cookie-parser')
const cors = require('cors')
const express = require('express');
const mongoose = require('mongoose')
const path = require('path')
const { app, server, io } = require("./socket")
// const { socketAuth } = require("./middlewears/socket.auth")
// io.use(socketAuth)
const MONGODB_URI = "mongodb://localhost:27017/rakumi"
const PORT = process.env.PORT || 3030

const adminRoutes = require("./routes/admin.route")
const userRoutes = require("./routes/user.route")

app.use(cookieParser());
app.use(express.json());

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With')
    next()
})
app.use("/uploads", express.static(path.join(__dirname, 'uploads')));
app.use("/*", express.static(path.join(__dirname, 'public')))
app.use("/admin", adminRoutes)
app.use("/user", userRoutes)

app.get('/get-cookie', (req, res) => {
    console.log("sent")
    res.cookie('session', 'aa', {
        httpOnly: true,
        secure: true,
        sameSite: "None", /////
        maxAge: 15 * 60 * 1000,
        // maxAge: 6 * 24 * 60 * 60 * 1000
        // path: "/"
    });
    res.json({ a: 1 })
})

app.get("/send-cookie", (req, res) => {
    console.log(req.cookies)
    if (req.cookies && req.cookies.session) {
        res.json({ found: 1 })
    } else {
        res.json({ found: 0 })
    }
})

app.get("/", (req, res) => {
    console.log("welcome")
    io.emit("test", "tyuio")
    res.send("<h1>Welcome!</h1>")
})

app.use((req, res) => {
    res.status(404).send("<h1>NOT FOUND!</h1>")
})

mongoose.connect(MONGODB_URI)
    .then(() => { server.listen(PORT) })
    .then(() => {
        console.log("Database Connection Successful!");
        console.log('Connected to DB:', mongoose.connection.name);
        console.log(`Server running... port ${PORT}`)
    })

mongoose.connection.on('connected', () => {
});

// exports.io = io