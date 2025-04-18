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

const Item = require('../models/products')
const Customer = require('../models/customers')
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
// const Item = item_fn("food_item", productSchema)

const { auth } = require("../middlewears/auth");
const customers = require("../models/customers");

router.use(bodyParser.urlencoded({ extended: true }));
// router.use(cookieParser());


router.post("/qwe", (req, res) => {
    if (req.token) {
        console.log(1)
    } else {
        console.log(2)
    }
})

router.get("/", (req, res) => {
    res.redirect("http://127.0.0.1:3000")
})

router.get("/count", async (req, res) => {
    try {
        const noOfFoodItems = await Item.countDocuments({})
        const noOfCustomers = await Customer.countDocuments({})
        const customerOrders = await Order.countDocuments({})
        res.json({ noOfFoodItems: noOfFoodItems, noOfCustomers: noOfCustomers })
    } catch (err) {
        console.log(err)
    }
})

router.get("/cc", async (req, res) => {
    const Order = await Order.find({})
    console.log(Order.orders)
    res.send(Order)
})

router.get("/food", async (req, res) => {
    try {
        const foodItems = await Item.find({})
        res.json(foodItems)
    } catch (err) {
        console.log(err)
    }
})

router.get("/customers", async (req, res) => {
    try {
        const customers = await Customer.find({}) // it's sending whole data with password
        res.json(customers)
    } catch (err) {
        console.log(err)
    }
})

router.get("/single-customer/:_id", async (req, res) => {
    let userId, userCart;
    let displayCart = {}
    let promises = [];
    function ff(ii){
        const dateString = ii;
        const date = new Date(dateString);
        const formattedDate = date.toDateString();
        return(formattedDate);
    }
    try {
        // const { email } = req.auth
        await Customer.findOne({"_id": req.params._id }) //await is necessary for userId
            .then(result => {
                // console.log(result)
                if (result) {
                    userId = (result._id).toString()
                    for (const date of result.cart) {
                        let promise = Order.findOne({ date: ff(date) })
                            .then(r => {
                                displayCart[date] = r?.orders?.get(userId)
                            })
                        promises.push(promise);
                    }
                }
            })
        Promise.all(promises)
            .then(() => {
                const sortedByKey = Object.keys(displayCart)
                    .sort()
                    .reduce((acc, key) => {
                        acc[key] = displayCart[key];
                        return acc;
                    }, {});
                res.json({ ...sortedByKey })
                // res.json({})
                // console.log({ ...sortedByKey })
                // console.log(displayCart)
                // console.log("..........................")
            })
            .catch(error => {
                console.error("Error:", error);
            });
    } catch (err) {
        console.log(err, "an error occcured with jwt, history...")
    }
})

router.get("/history", async (req, res) => {
    await Order.findOne({ date: "Tue Sep 10 2024" }).lean().exec()
        .then(r => res.status(200).json(r.orders))
    // .then(res.end())
})

// router.get("/histor", async (req, res) => {
//     await Order.find({})
//         .then(r => res.json(r))
//     // .then(res.end())
// })

router.get("notification", async () => {
    res.send("<h1>Welcome!</h1>")
    socket.emit("event", { val: 33 })
})

router.post("/login", (req, res) => {
    let admin;
    let token;
    const { email, password } = req.body
    Admin.findOne({ email: email })
        .then(result => {
            if (result == null) {
                res.send("email does not exist")
            } else {
                admin = result
                bcrypt.compare(password, admin.password, function (err, data) {
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

router.put('/add-item', upload.single("img"), async (req, res) => {
    try {
        const item = {  //fields to extract only
            _id: req.body?._id,
            name: req.body.name,
            maxi_price: req.body.maxi_price,
            maxi_unit: req.body.maxi_unit,
            mini_price: req.body.mini_price,
            mini_unit: req.body.mini_unit,
            multiplier: req.body.multiplier,
            checkState: req.body.checkState,
            initialState: req.body.initialState,
            category: req.body.category
        }
        const img = req.file?.path ? path.normalize(req.file.path) : null
        const updatedItem = img ? { ...item, img } : { ...item }
        if (item._id) {
            const saved = await Item.findByIdAndUpdate(item._id, updatedItem, { new: true })
            if (saved) {
                res.status(200).json({ status: true })
            } else {
                console.log("couldn't save")
                res.status(400).json({ status: false })
            }
        } else {
            const itemToAdd = Item({ ...item, img })
            itemToAdd.save().then(() => res.status(200).json({ status: true }))
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ status: false, error: err.message });
    }
})
 
router.delete('/:_id', async (req, res) => {
    // const Item = item_fn("food_item", productSchema)
    try {
        const del = await Item.findByIdAndDelete({ "_id": req.params._id })
        if (del) {
            res.status(200).json({ status: true })
        } else {
            res.status(404).json({ status: false, message: "Item not found" });
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ status: false });
    }
})

module.exports = router