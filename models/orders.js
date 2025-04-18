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

const mainSchema = new Schema({
    date: {
        // type: Number, look here 
        type: String,
        required: true
    },
    orders: {
        type: Map,
        of: [[orderSchema]]
    }
});

module.exports = mongoose.model('Order', mainSchema);