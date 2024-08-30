const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    name: String,
    mini_unit: String,
    mini_price: Number,
    mini_quantity: Number,
    maxi_unit: String,
    maxi_price: Number,
    maxi_quantity: Number,
    category: String,
    cost: Number,
    paymentId: {
        type: Number,
        _id: false
    },
    totalCost: {
        type: Number,
        _id: false
    },
}, { _id: false }, {timestamps: true});

const MainSchema = new Schema({
    date: {
        // type: Number, look here 
        type: String,
        required: true
    },
    orders: {
        type: Map,
        of: [[OrderSchema]]
    }
});

module.exports = mongoose.model('Order', MainSchema);

// const mongoose = require("mongoose")
// const product = require("../models/products")
// const Schema = mongoose.Schema

// const recordSchema = new Schema({
//     user_id: {
//         type: String,
//         required: true,
//     },
//     items: [product]
// })

// const orderSchema = new Schema({
//     date: [{
//         value: Date,
//         orders: [recordSchema]
//     }]
// })
// const prod = new Schema({
//     id: {
//         type: String,
//         required: true,
//     },
//     name: {
//         type: String,
//         required: true,
//     },
//     mini_unit: {
//         type: String,
//         required: true,
//     },
//     mini_price: {
//         type: Number,
//         required: true,
//     },
//     maxi_unit: {
//         type: String,
//         required: true,
//     },
//     maxi_price: {
//         type: Number,
//         required: true,
//     },
//     cost: {
//         type: Number,
//     },
//     checkState: {
//         type: Boolean,
//         default: false,
//     },
//     initialState: {
//         type: Boolean,
//         default: false,
//     }
// }, {timestamps: true})

// const Product = mongoose.model("Product", prod)
// const Record = mongoose.model("Record", recordSchema)
// const Order = mongoose.model("Order", orderSchema)

// module.exports = {
//     Product,
//     Record,
//     Order,
//   };


// // var user = new Schema({
// //     foo: [ {
// //         address: {type: String},
// //         email: {type: String, unique: true}
// //     }],
// //     bar: [ "simple", "array" ]
// // });

