require("dotenv/config")
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const cors = require('cors')
const express = require('express');
var fs = require('fs')
const app = express()
const mongoose = require('mongoose')
const path = require('path')
const privateKey = fs.readFileSync(path.resolve(__dirname, 'server.key'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname, 'server.crt'), 'utf8');

const credentials = { key: privateKey, cert: certificate };
const server = require('http').createServer(credentials, app)
const socketIO = require('socket.io');
const io = socketIO(server, {
    cors: { origin: "*" }
});

const MONGODB_URI = process.env.MONGODB_URI
const PORT = process.env.PORT || 27017;

const item_fn = (collection, Schema) => {
    return mongoose.model(collection, productSchema)
}
const productSchema = require('./models/products')

const adminRoutes = require("./routes/admin")
const userRoutes = require("./routes/user")

app.use(bodyParser.json())
// app.use(cors({
//     credentials: true,
//     origin: 'http://localhost:3000',
// }))
app.use(cors())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: false }))
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:3000")
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With')
    next()
})
app.use(express.static('public'))
app.use("/admin", adminRoutes)
app.use(userRoutes)

app.use('/', function (req, res, next) {
    res.cookie('title', 'Petervenstidfghndsred', {
        // secure: true,
        // sameSite: "lax",
        // httpOnly: true,
        // path: "/"
    })
    // res.setHeader('Set-Cookie', 'title=Peterven', 'SameSite=None', 'secure', 'httpOnly=true')
    next();
})

app.get("/", (req, res) => {
    res.send("<h1>Welcome!</h1>")
})

app.get("/logi", (req, res) => {
    console.log(req.cookies)
    if (req.cookies && req.cookies.title){
        res.json({found: 1})
    } else{
        res.json({found: 0})
    }
})

app.use((req, res) => {
    res.status(404).send("<h1>NOT FOUND!</h1>")
})

const DBoptions = {
    dbName: "ruteso",
    // user: 'username',
    // pass: 'password',
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000,
}
mongoose.connect(MONGODB_URI, DBoptions)
    .then(() => {
        server.listen(PORT)

        io.on("connection", (socket) => {
            console.log("client connected! " + socket.id)
            socket.on("hello", (arg, callback) => {
                console.log(arg)
                // callback("got it")
            });

        });

    })
    .then(() => {
        console.log("Database Connection Successful!");
        console.log(`Server running... port ${PORT}`)
    })

// server.listen(PORT, () => {
//     console.log(`HTTPS Server running on port ${PORT}`);
//   });