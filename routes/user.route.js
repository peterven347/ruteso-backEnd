const bcrypt = require("bcryptjs")
const express = require("express")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose");
const router = express.Router()
const stripe = require("stripe")(process.env.SK_TEST);

const User = require("../models/user.model")
const Order = require("../models/order.model")
const { Product } = require("../models/product.model")
const { auth } = require("../middlewears/user.auth");
const { io } = require("../socket")

const userNameSpace = io.of("/user")
userNameSpace.on("connection", (socket) => {
    socket.on("disconnect", () => {
        // console.log("disconnected")
    });
    socket.on("error", () => {
        console.log("socket error")
        socket.disconnect()
    })
})
router.get("/test", async (req, res) => {
    try {
        const yyy = await User.findOne({ email: "peter@gmail.com" })
        console.log(yyy)
        res.end()
    } catch (err) {
        console.log(err)
        res.send(err)
    }
})

router.get("/product", auth, async (req, res) => {
    try {
        const last_purchase = await User.findOne({ email: req.auth.email }).select("-_id last_purchase")
        const items = await Product.find({})
        res.status(200).json({ success: true, items, last_purchase })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

router.get("/history", auth, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.auth.email })
        const history = await Order.find({ user_id: user._id }).sort({ createdAt: -1 })
        res.status(200).json({ success: true, history })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
})

router.put("/register", (req, res) => {
    let user;
    const { firstName, email, password } = req.body
    User.findOne({ email: email })
        .then(result => {
            if (result) {
                user = result
                console.log("User exists")
                console.log(result)
            } else {
                bcrypt.hash(password, 10)
                    .then(hashedPassword => {
                        const newCustomer = new User({
                            firstName: firstName,
                            email: email,
                            password: hashedPassword,
                        })
                        newCustomer.save().then(neww => console.log(neww))
                        const token = jwt.sign({
                            email: email,
                        }, "mysupersecrettoken", { expiresIn: "90000h" })
                        res.json({ firstName: firstName, token: token })
                        console.log("new user added!")
                    })
            }
        })
})

router.post("/login", (req, res) => {
    let user;
    const { eMail, password } = req.body
    User.findOne({ eMail: eMail })
        .then(result => {
            if (result == null) {
                console.log("Email does not exist")
            } else {
                user = result
                bcrypt.compare(password, user.password)
                    .then(isValid => {
                        if (!isValid) {
                            console.log("Incorrect password")
                            return;
                        }
                        const token = jwt.sign({
                            email: user.email,
                        }, "mysupersecrettoken", { expiresIn: "90000000000h" })
                        res.json({ firstName: user.firstName, token: token })
                        console.log(user._id + "logged in")
                    })
            }
        })
})

router.patch("/order", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.auth.email})
        const cart = req.body
        const temp = cart.filter(i => mongoose.Types.ObjectId.isValid(i._id)).map(i => new mongoose.Types.ObjectId(i._id))
        const validItems = await Product.find({ _id: { $in: temp } }).select("mini_price maxi_price")
        const orderItems = cart.map(i =>
            validItems.some(j => j.id === i._id) ?
                { ...i, mini_price: validItems.find(k => k.id === i._id).mini_price, mini_quantity: Math.abs(i.mini_quantity), maxi_price: validItems.find(k => k.id === i._id).maxi_price, maxi_quantity: Math.abs(i.maxi_quantity) }
                : null
        ).filter(Boolean)
        let user_last_purchase = user.last_purchase
        let total_cost = orderItems?.reduce((acc, i) => {
            return acc + ((i.maxi_price * i.maxi_quantity + i.mini_price * i.mini_quantity));
        }, 0)

        const order = new Order({
            user_id: user._id,
            payment_id: 77,
            total_cost: total_cost,
            orders: orderItems,
        })

        const bulkUpdate = []
        orderItems.forEach((i) => {
            user_last_purchase[i._id] = { mini_price: i.mini_price, maxi_price: i.maxi_price }
            bulkUpdate.push({
                updateOne: {
                    filter: { _id: i._id },
                    update: { $inc: { total_stock: -Number(i.maxi_quantity) } },
                }
            })
        })

        user.set("last_purchase", user_last_purchase)
        user.set("last_purchase_date", Date.now())
        await order.save()
        await user.save()
        await Product.bulkWrite(bulkUpdate)
        userNameSpace.emit("purchaseOrder", order.toObject())
        // userNameSpace.emit("purchaseOrder", orderItems.map(({ _id, maxi_quantity }) => ({ _id, maxi_quantity })))
        res.json({ success: true, order })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "an error occured" })
    }
});

// router.patch("/orderrr", async (req, res) => {
//     try {
//         const date = new Date(Date.now()).toDateString()
//         let _cart, cart, userId, user, cost, updatedCart, lastPurchases, tempLastPurchases, paymentIntentId;
//         // const { email } = req.auth
//         await User.findOne({ eMail: "petervewest1@gmail.com" })
//             .then(result => {
//                 if (result) {
//                     user = result
//                     userId = (result._id).toString()
//                     lastPurchases = result.lastPurchases
//                 }
//             })
//         _cart = [].concat(Object.values({ ...req.body })).slice(0, -1)
//         // for (i of _cart) {
//         //     tempLastPurchases = Object.fromEntries(lastPurchases)
//         //     tempLastPurchases[i._id] = i.maxi_price
//         //     lastPurchases = new Map(Object.entries(tempLastPurchases))
//         // }
//         cost = _cart?.reduce((acc, i) => {
//             return acc + ((i.maxi_price * i.maxi_quantity + i.mini_price * i.mini_quantity));
//         }, 0)
//         cart = [..._cart, { totalCost: cost, date: Date.now(), payment_id: 77 }]

//         await Order.findOne({ date: date })
//             .then(result => {
//                 if (result == null) {
//                     const record = new Order({
//                         date: date, // today"s date to be used if there"s been no previous order for the day
//                         orders: {
//                             [userId]: [[...cart]]
//                         },
//                     })
//                     record.save()
//                         .then(r => {
//                             if (r) {
//                                 const userCart = [...new Set([new Date(Date.now()), ...user?.cart])]
//                                 // const userCart = [...new Set([...user.cart, new Date(Date.now()).toDateString()])]
//                                 User.findOneAndUpdate({ _id: userId }, { cart: userCart, lastPurchases: lastPurchases })
//                                     .then(console.log("saved"))
//                             }
//                         })
//                 } else {
//                     const resObj = result.toObject()
//                     const ordersMap = resObj.orders
//                     if (ordersMap.has(userId)) {  // _id already ordered today
//                         updatedCart = [...ordersMap.get(userId), cart]
//                         result.orders.set(userId, updatedCart)
//                         result.save()
//                             .then(console.log("saved.."))
//                     } else {
//                         result.orders.set(userId, [cart])  // cart because _id has not ordered today, no cart to be updated
//                         result.save()
//                             .then(r => {
//                                 if (r) {
//                                     const userCart = [...new Set([new Date(Date.now()), ...user.cart])]
//                                     User.findOneAndUpdate({ _id: userId }, { cart: userCart, lastPurchases: lastPurchases })
//                                         .then(console.log("saved..."))
//                                 }
//                             })
//                     }
//                 }
//             })
//         res.json({ costVal: cost })
//     } catch (err) {
//         console.log(err)
//         res.status(500).json({ success: false, message: "an error occured" })
//     }
// });


// router.get("/history", auth, async (req, res) => {
//     let userId, userCart, orders;
//     let displayCart = {}
//     let promises = [];
//     try {
//         const { email } = req.auth
//         await User.findOne({ eMail: email })
//             .then(result => {
//                 if (result) {
//                     userId = (result._id).toString()
//                     userCart = result.cart
//                     for (const date of userCart) {
//                         let promise = Order.findOne({ date: date })
//                             .then(r => {
//                                 displayCart[date] = r.orders?.get(userId)
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
//         console.log(err)
//         res.status(500).json({ success: false, message: "an error occured" })
//     }
// })




// Watch this video to get started: https://youtu.be/rPR2aJ6XnAc.


router.post("/payment-sheet", auth, async (req, res) => {
    let _cart = [].concat(Object.values({ ...req.body }))
    let cost = await _cart.reduce((acc, i) => {
        return acc + ((i.maxi_price * i.maxi_quantity + i.mini_price * i.mini_quantity));
    }, 0) * 100000
    // Use an existing User ID if this is a returning customer.
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: "2023-10-16" }
    );
    const paymentIntent = await stripe.paymentIntents.create({
        amount: cost,
        currency: "NGN",
        customer: customer.id,
        automatic_payment_methods: {
            enabled: true,
        },
    });
    //   const pa = await stripe.paymentIntents.retrieve(
    //     paymentIntent.id
    //   );
    //   console.log(pa.status)
    res.json({
        paymentIntentId: paymentIntent.id,
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey: process.env.PUBLISHABLE_KEY
    });
});

module.exports = router
