const bcrypt = require("bcryptjs")
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require("express")
const fs = require('fs')
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')
const multer = require('multer')
const path = require('path');
const router = express.Router()

const productSchema = require('../models/products')
const userSchema = require('../models/users')
const Order = require('../models/orders')
const Admin = require('../models/admin')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dynamicDest = "uploads/images";
        // const dynamicDest = `uploads/${req.body.name}`;
        if (!fs.existsSync(dynamicDest)) {
            fs.mkdirSync(dynamicDest, { recursive: true });
        }
        cb(null, dynamicDest);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now().toString() + '-' + file.originalname)
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpg" || file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true)
    } else {
        cb(null, false)
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter })

const item_fn = (collection, Schema) => {
    return mongoose.model(collection, productSchema)
}

const { auth } = require("../middlewears/auth")

router.use(bodyParser.urlencoded({ extended: true }));
// router.use(cookieParser());


router.post("/qwe", auth, (req, res) => {
    if(req.token){
        console.log(1)
    } else {
        console.log(2)
    }
})

router.get("/", (req, res) => {
    res.redirect("http://127.0.0.1:3000")
})

router.get("/count", auth, async (req, res) => {
    try {
        const noOfFoodItems = await item_fn('food_item', productSchema).countDocuments({})
        const noOfAdmins = await item_fn('Admin', userSchema).countDocuments({})
        res.json({ noOfFoodItems: noOfFoodItems, noOfAdmins: noOfAdmins })
    } catch (err) { console.log("couldn't load counts") }
})

router.get("/food", auth, async(req, res) => {
    try {
        const foodItems = await item_fn('food_item', productSchema).find({})
        res.json(foodItems)
        console.log("food items delivered")
    } catch (err) {
        console.log(err)
    }
})

router.get("/history", auth, async (req, res) => {
    await Order.findOne({ date: "Fri Apr 05 2024" }).lean().exec()
        .then(r => res.json(r.orders))
    // .then(res.end())
})

router.get("notification", auth, async () => {
    res.send("<h1>Welcome!</h1>")
    socket.emit("event", { val: 33 })
})

router.post('/add-item', auth, upload.single("img"), (req, res) => {
    const Item = item_fn("food_item", productSchema)
    const itemToAdd = new Item({
        name: req.body.name,
        mini_unit: req.body.mini_unit,
        mini_price: req.body.mini_price,
        maxi_unit: req.body.maxi_unit,
        maxi_price: req.body.maxi_price,
        category: req.body.category,
        img: path.normalize(req.file.path)
    })
    itemToAdd.save().then(() => console.log("Saved!"))
        // .then(res.redirect("http://localhost:3000/stocks"))
        .then(res.end())

})

router.post("/login", (req, res) => {
    let admin;
    let token;
    const { email, password } = req.body
    Admin.findOne({ email: email })
        .then(result => {
            if (result == null){
                res.send("email does not exist")
            }else{
                admin = result
                bcrypt.compare(password, admin.password, function(err, data){
                    if (err) {
                        res.end()
                    }
                    if (data) {
                        token = jwt.sign({
                            email: email,
                            id: admin._id.toString() + 654
                        }, "mysupersecrettoken", { expiresIn: '100h' })
                        // res.setHeader("Set-Cookie", "token=Peterven")
                        res.cookie('token', token, {
                            httpOnly: true,
                            // secure: process.env.NODE_ENV === 'production',
                            // sameSite: 'strict',
                            // maxAge: 90000
                        })
                        // res.redirect("/admin")
                        res.end()
                    } else {
                        res.status(401).send("Wrong password!!")
                    }
                })
            }
        })
})

router.post("/register", (req, res) => {
    let admin;
    const { email, password } = req.body
    Admin.findOne({ email: email })
        .then(result => {
            if (result) {
                admin = result
                res.send("You already exist!")
                return;
            } else {
                bcrypt.hash(password, 10)
                    .then(hashedPassword => {
                        const newAdmin = new Admin({
                            email: email,
                            password: hashedPassword
                        })
                        newAdmin.save()
                        .then(res.redirect("http://127.0.0.1:3000/login"))
                    })
                
            }
        })
})

router.delete('/:_id', auth, async (req, res) => {
    const Item = item_fn("food_item", productSchema)
    await Item.findByIdAndDelete({ "_id": req.params._id })
        .then(res.status(200).json({ status: true }))
})

module.exports = router