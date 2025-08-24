const express = require('express');
const fs = require('fs')
const https = require('http')
const socketIO = require('socket.io');

const app = express()
const server = https.createServer(
    // {
    //     key: fs.readFileSync("key.pem"),
    //     cert: fs.readFileSync("cert.pem")
    // }, 
    app
)
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
})

module.exports = {app, server, io}