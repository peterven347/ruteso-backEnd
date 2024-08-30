const bcrypt = require("bcryptjs")
const express = require("express")
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')
const router = express.Router()
const stripe = require('stripe')(process.env.SK_TEST);

const Customer = require('../models/users')
const productSchema = require('../models/products')
const Order = require('../models/orders')
const item_fn = (collection, Schema) => {
    return mongoose.model(collection, productSchema)
}

const { auth } = require("../middlewears/auth")

router.get("/food", auth, async (req, res) => {
    try {
        const foodItems = await item_fn('food_item', productSchema).find({})
        res.json(foodItems)
        console.log("food items delivered")
    } catch (err) {
        console.log(err, "valid")
    }
})

router.get('/history', auth, async (req, res) => {
    let userId, userCart, orders;
    let displayCart = {}
    let promises = [];
    try {
        const { email } = req.auth
        await Customer.findOne({ eMail: email }) //await is necessary for userId
            .then(result => {
                if (result) {
                    user = result
                    userId = (result._id).toString()
                    userCart = result.cart
                    for (const date of userCart) {
                        let promise = Order.findOne({ date: date })
                            .then(r => {
                                displayCart[date] = r.orders.get(userId)
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
            })
            .catch(error => {
                console.error("Error:", error);
            });
    } catch (err) {
        console.log(err, "an error occcured with jwt, history...")
    }
})

router.put('/register', (req, res) => {
    let user;
    const { firstName, eMail, password } = req.body
    Customer.findOne({ eMail: eMail })
        .then(result => {
            if (result) {
                user = result
                console.log("User exists")
            } else {
                bcrypt.hash(password, 10)
                    .then(hashedPassword => {
                        const newCustomer = new Customer({
                            firstName: firstName,
                            eMail: eMail,
                            password: hashedPassword
                        })
                        newCustomer.save().then(neww => console.log(neww))
                        const token = jwt.sign({
                            email: eMail,
                            // id: user._id.toString()
                        }, "mysupersecrettoken", { expiresIn: '90000h' })
                        res.json({ firstName: firstName, token: token })
                        console.log("new user added!")
                    })
            }
        })
})

router.post("/login", (req, res) => {
    let user;
    const { eMail, password } = req.body
    Customer.findOne({ eMail: eMail })
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
                            email: user.eMail,
                        }, "mysupersecrettoken", { expiresIn: '90000000000h' })
                        res.json({ firstName: user.firstName, token: token })
                        console.log(user._id + "logged in")
                    })
            }
        })
})

router.patch('/order', auth, async (req, res) => {
    const date = Date.now()
    let _cart, cart, userId, user, cost, updatedCart, paymentIntentId;
    try {
        const { email } = req.auth
        await Customer.findOne({ eMail: email }) //await is necessary for userId
            .then(result => {
                if (result) {
                    user = result
                    userId = (result._id).toString()
                }
            })
        paymentIntentId = [].concat(Object.values({ ...req.body })).pop()
        _cart = [].concat(Object.values({ ...req.body })).slice(0, -1)
        cost = _cart.reduce((acc, i) => {
            return acc + ((i.maxi_price * i.maxi_quantity + i.mini_price * i.mini_quantity));
        }, 0)
        cart = [..._cart, { paymentId: paymentIntentId }, { totalCost: cost }]

        await Order.findOne({ date: date })
            .then(result => {
                if (result == null) {
                    const record = new Order({
                        date: date, // today's date to be used if there's been no previous order for the day
                        orders: {
                            [userId]: [[...cart]]
                        },
                    })
                    record.save()
                        .then(r => {
                            if (r) {
                                const userCart = [...new Set([new Date(Date.now()), ...user.cart])]
                                // const userCart = [...new Set([...user.cart, new Date(Date.now()).toDateString()])]
                                Customer.findOneAndUpdate({ _id: userId }, { cart: userCart })
                                    .then(console.log("saved"))
                            }
                        })
                } else {
                    const resObj = result.toObject()
                    const ordersMap = resObj.orders
                    if (ordersMap.has(userId)) {  // _id already ordered today
                        updatedCart = [...ordersMap.get(userId), cart]
                        result.orders.set(userId, updatedCart)
                        result.save()
                            .then(console.log("saved.."))
                    } else {
                        result.orders.set(userId, [cart])  // cart because _id has not ordered today, no cart to be updated
                        result.save()
                            .then(r => {
                                if (r) {
                                    const userCart = [...new Set([new Date(Date.now()), ...user.cart])]
                                    Customer.findOneAndUpdate({ _id: userId }, { cart: userCart })
                                        .then(console.log("saved..."))
                                }
                            })
                    }
                }
            })
        res.json({ costVal: cost })
    } catch (err) {
        console.log(err, "an error occcured with jwt, order...")
    }
}
);



// Watch this video to get started: https://youtu.be/rPR2aJ6XnAc.
router.post('/payment-sheet', auth, async (req, res) => {
    let _cart = [].concat(Object.values({ ...req.body }))
    let cost = await _cart.reduce((acc, i) => {
        return acc + ((i.maxi_price * i.maxi_quantity + i.mini_price * i.mini_quantity));
    }, 0) * 100000
    // Use an existing Customer ID if this is a returning customer.
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2023-10-16' }
    );
    const paymentIntent = await stripe.paymentIntents.create({
        amount: cost,
        currency: 'NGN',
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
        publishableKey: process.env.PUBLISHABLE_KEY || "pk_test_51P3QJKRp1Ag2868eLwYfP27btVnM23crYTDMR260uqLIl8dgJ31qCIdNnER2Sh3SGvumtivvjB72w5MRJqiRpImY00rdqer6zq"
    });
});


module.exports = router




// function extraFunction(req, res, next) {
//     console.log("This is a function!");
//     if (8 == 8) {
//         return
//     }
//     console.log("This is an extra function!");
//     req.extraData = { message: "foood" };
//     next();
// }

// router.get('/api/test', extraFunction, (req, res) => {
//     const ion = req.extraData.message;
//     res.redirect(`http://localhost:27017/${ion}`)
//     console.log("Main logic executed!");
// });

// router.get('/image/:filename', (req, res) => {
//     const encodedFilename = req.params.filename;
//     const decodedFilename = decodeURIComponent(encodedFilename);
//     const filePath = path.join(__dirname, 'uploads', decodedFilename);

//     // Check if the file exists before sending
//     if (fs.existsSync(filePath)) {
//         // Send the file directly
//         res.sendFile(filePath);
//     } else {
//         res.status(404).send('File not found');
//     }
// });