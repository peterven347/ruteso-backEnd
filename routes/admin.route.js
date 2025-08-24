const bcrypt = require("bcryptjs")
const express = require("express")
const fs = require('fs')
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')
const multer = require('multer')
const router = express.Router()

const Admin = require('../models/admin.model')
const Order = require('../models/order.model')
const Stock = require("../models/stock.model")
const User = require('../models/user.model')
const { Product, ProductX } = require('../models/product.model')
const { auth } = require("../middlewears/admin.auth");
const { socketAuth } = require("../middlewears/socket.auth")
const { io } = require("../socket")

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
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpg" || file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true)
    } else {
        cb(null, false)
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter })

const adminNameSpace = io.of("/admin")
adminNameSpace.use(socketAuth)
adminNameSpace.on("connection", (socket) => {
    console.log(999)
    if (!socket.auth) {
        socket.emit("invalid token")
        socket.disconnect()
    }
    // socket.on("event", (arg, callback) => {
    //     if (socket.handshake.headers.cookie) {
    //         const token = cookie.parse(socket.handshake.headers.cookie)
    //         console.log(token)
    //     } else {
    //         console.log("no cookie found")
    //     }
    //     // console.log(arg)
    //     callback(arg)
    // })
    socket.on("disconnect", () => {
        // console.log("disconnected")
    });
    socket.on("error", () => {
        console.log("socket error")
        socket.disconnect()
    })
})
router.get("/", (req, res) => {
    res.redirect("http://127.0.0.1:3000")
})

router.get("/test", async (req, res) => {
    try {
        res.status(200).json({ percentage })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "an error occured" })
    }
})

router.get("/count", async (req, res) => {
    let year = new Date(Date.now()).getFullYear()
    let month = new Date(Date.now()).getMonth()
    try {
        const noOfFoodItems = await Product.countDocuments({})
        const noOfCustomers = await User.countDocuments({})
        const noOfActiveCustomers = await User.countDocuments({ last_purchase_date: { $gte: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000) } })
        const total_cost = await Order.find({
            createdAt: {
                $gte: new Date(year, month, 1),
                $lt: new Date(year, month + 1, 1)
            }
        }).select("total_cost -_id")
        const revenue = total_cost.reduce((acc, i) => {
            return acc + i.total_cost
        }, 0)
        res.json({ noOfFoodItems: noOfFoodItems, noOfCustomers: noOfCustomers, noOfActiveCustomers: noOfActiveCustomers, revenue: revenue })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

router.get("/percent", async (req, res) => {
    try {
        const stockData = await Stock.find().select("-_id item_id stock")
        const itemIds = [...new Set(stockData.map(s => s.item_id.toString()))];
        const products = await Product.find({ _id: { $in: itemIds } }).select("name total_stock");
        const productMap = new Map()
        products.forEach(p => productMap.set(p._id.toString(), { total_stock: p.total_stock, name: p.name }));
        const data = stockData.reduce((acc, curr) => {
            const exists = acc.find(i => i.item_id.equals(curr.item_id));
            if (exists) {
                exists.stock += curr.stock;
            } else {
                acc.push({
                    ...curr.toObject(),
                    total_stock: productMap.get(curr.item_id.toString())?.total_stock,
                    name: productMap.get(curr.item_id.toString())?.name
                });
            }
            return acc;
        }, []);
        const percentage = data.map(({item_id, name, stock, total_stock}) => ({ item_id, name, percent: Number((((stock-total_stock)/stock)*100).toFixed(2)) }))
        .filter( i => i.name && !isNaN(i.percent)) //filter for stocks marked unavailable, they return { item_id: item_id, name: undefined, percent: 'NaN'}
        res.status(200).json({ success: true, data: percentage })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "an error occured" })
    }
})

router.get("/food", async (req, res) => {
    try {
        const foodItems = await Product.find({})
        res.json(foodItems)
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

router.get("/unavailable", async (req, res) => {
    try {
        const foodItems = await ProductX.find({})
        res.json(foodItems)
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

router.get("/customers", async (req, res) => {
    try {
        const customers = await User.find({}) // it's sending whole data with password
        res.json(customers)
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

router.get("/single-customer/:_id", async (req, res) => {
    try {
        const orders = await Order.find({ user_id: req.params._id })
        res.json(orders)
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

router.get("/logout", (req, res) => {
    try {
        res.cookie("session", "", {
            httpOnly: true,
            secure: true,
            sameSite: "None", /////
        });
        // const socket = io.sockets.sockets.get("uB0T3oCTnXhGgH9gAAAB") would it bettre to have the user send hos id?
        // if (socket) {
        //     socket.disconnect()
        // }
        res.json({ success: true })
    } catch (err) {
        console.error(err)
        res.json({ success: false })
    }
})

router.post("/register", async (req, res) => {
    const { email, password } = req.body
    const admin = await Admin.findOne({ email: email })
    if (admin) return res.send("You already exist! proceed to login.")
    bcrypt.hash(password, 10)
        .then(hashedPassword => {
            const newAdmin = new Admin({
                email: email,
                password: hashedPassword
            })
            newAdmin.save()
                .then(res.json({ success: true }))
        })
})

router.post("/login", async (req, res) => {
    const { email, password, remember } = req.body
    const admin = await Admin.findOne({ email: email })
    if (!admin) return res.json({ success: false, message: "user does not exist" })
    bcrypt.compare(password, admin.password, function (err, data) {
        if (err) return res.json({ success: false, message: "Wrong password" })
        if (data) {
            const token = jwt.sign({
                email: email,
                id: admin.id
            }, process.env.ACCESS_TOKEN, { expiresIn: remember ? '5d' : '8h' })
            res.cookie('session', token, {
                httpOnly: true,
                secure: true,
                sameSite: "None", /////
                // maxAge: 500 * 24 * 60 * 60 
                maxAge: remember ? 5 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000
            })
            res.json({ success: true })
        }
    })
})

router.post("/history", async (req, res) => {
    const { year, month, today } = req.body
    try {
        const monthData = await Order.find({
            createdAt: {
                $gte: new Date(+year, month, 1),
                $lt: new Date(+year, month + 1, 1)
            }
        }).sort({ createdAt: -1 })
        const result = {}
        const todayOrder = {}
        monthData.forEach(i => {
            let date = new Date(i.createdAt).getDate()
            result[date] = {
                totalCustomers: [
                    ...new Set(monthData.map(i => new Date(i.createdAt).getDate() === date && i.user_id.toString()))
                ].filter(Boolean).length,
                totalOrders: [
                    ...new Set(monthData.map(i => new Date(i.createdAt).getDate() === date && i.id))
                ].filter(Boolean).length
            }
        })
        if (today) {
            monthData.forEach(i => {
                if (todayOrder.hasOwnProperty(i.user_id)) {
                    const temp = monthData.filter(j => j.user_id === i.user_id)
                    for (let i of temp) {
                        todayOrder[i.user_id].push(i)
                    }
                } else {
                    todayOrder[i.user_id] = [...monthData.filter(j => j.user_id === i.user_id)]
                }
            })
        }
        res.status(200).json({ success: true, data: result, todayOrder: todayOrder })
    } catch (err) {
        console.error(err)
        res.json({ success: false, message: "an error occured" })
    }
})

router.post("/add-stock", async (req, res) => {
    const { itemId, stockCount, price, info } = req.body
    try {
        const product = await Product.findByIdAndUpdate(itemId, { $inc: { total_stock: Number(stockCount) } })
        if (!product) return res.json({ success: false })
        const newStock = new Stock({
            item_id: itemId,
            stock: stockCount,
            price: price,
            info: info
        })
        await newStock.save()
        res.json({ success: true })
    } catch (err) {
        res.json({ success: false })
        console.log(err)
    }
})

router.put('/add-item', upload.single("img"), async (req, res) => {
    try {
        const item = {  //fields to extract only
            _id: req.body?._id || req.body.id,
            name: req.body.name,
            maxi_price: req.body.maxi_price,
            maxi_unit: req.body.maxi_unit,
            mini_price: req.body.mini_price,
            mini_unit: req.body.mini_unit,
            category: req.body.category,
            exp_date: req.body.exp_date,
            total_stock: req.body.total_stock
        }
        const img = req.file?.path ? path.normalize(req.file.path) : null
        if (item._id) {
            const payload = img ? { ...item, img } : { ...item }
            const { total_stock, ...updateData } = payload
            const saved = await Product.findByIdAndUpdate(item._id, updateData, { new: true })
            if (saved) {
                adminNameSpace.emit("editItem", updateData) //emit the data
                res.status(200).json({ success: true })
            } else {
                res.status(400).json({ success: false })
            }
        } else {
            const itemToAdd = new Product({ ...item, img })
            itemToAdd.save().then(() => {
                res.status(200).json({ success: true })
                adminNameSpace.emit("addItem", itemToAdd) //emit the data
            })
        }
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

router.put('/:_id', async (req, res) => {
    const _id = req.params._id
    if (!_id) return res.json({ success: false })
    try {
        const itemToRestore = await ProductX.findById(_id)
        if (!itemToRestore) return res.status(404).json({ success: false, message: "Item not found" });
        await new Product(itemToRestore.toObject()).save()
        await itemToRestore.deleteOne()
        adminNameSpace.emit("restoreItem", _id)
        res.status(200).json({ success: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

router.delete('/:_id', async (req, res) => {
    const _id = req.params._id
    if (!_id) return res.json({ success: false })
    try {
        const itemToRem = await Product.findById(_id)
        if (!itemToRem) return res.status(404).json({ success: false, message: "Item not found" });
        await new ProductX(itemToRem.toObject()).save()
        await itemToRem.deleteOne()
        adminNameSpace.emit("deleteItem", _id)
        res.status(200).json({ success: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

module.exports = router


// router.get("/single-customer/:_id",  async (req, res) => {
//     let userId, userCart;
//     let displayCart = {}
//     let promises = [];
//     function formatDate(dateString) {
//         // const dateString = date;
//         const date = new Date(dateString);
//         const formattedDate = date.toDateString();
//         return (formattedDate);
//     }
//     try {
//         // const { email } = req.auth
//         await Customer.findOne({ "_id": req.params._id })
//             .then(result => {
//                 // console.log(result)
//                 if (result) {
//                     userId = (result._id).toString()
//                     for (const date of result.cart) {
//                         let promise = Order.findOne({ date: formatDate(date) })
//                             .then(r => {
//                                 displayCart[date] = r?.orders?.get(userId)
//                             })
//                         promises.push(promise);
//                     }
//                 }
//             })
//         Promise.all(promises)
//             .then(() => {
//                 const sortedByKey = Object.keys(displayCart)
//                     .sort()
//                     .reduce((acc, key) => {
//                         acc[key] = displayCart[key];
//                         return acc;
//                     }, {});
//                 res.json({ ...sortedByKey })
//             })
//             .catch(error => {
//                 console.error("Error:", error);
//             });
//     } catch (err) {
//         console.error(err)
//         res.status(500).json({ success: false, message: "an error occured" })
//     }
// })