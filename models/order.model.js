const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    name: String,
    mini_unit: String,
    mini_price: Number,
    mini_quantity: Number,
    maxi_unit: String,
    maxi_price: Number,
    maxi_quantity: Number,
}, { _id: false });

const mainSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    payment_id: Number, //string ?
    total_cost: Number,
    status: {
        type: String,
        default: "packaged"
    },
    orders: {
        type: Array,
        of: orderSchema
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', mainSchema);




// const orderSchema = new Schema({
//     user_id: {
//         type: Schema.Types.ObjectId,
//         ref: User
//     },
//     payment_id: {
//         type: Number, //string ?
//         // _id: false
//     },
//     name: String,
//     mini_unit: String,
//     mini_price: Number,
//     mini_quantity: Number,
//     maxi_unit: String,
//     maxi_price: Number,
//     maxi_quantity: Number,
//     category: String,
//     cost: Number,
//     totalCost: {
//         type: Number,
//         // _id: false
//     },
// }, { _id: false }, {timestamps: true});

// const mainSchema = new Schema({
//     date: {
//         type: Date,
//         default: Date.now
//     },
//     orders: {
//         type: Map,
//         of: [[orderSchema]]
//     }
// }, {timestamps: true});