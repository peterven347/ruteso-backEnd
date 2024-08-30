const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchemaa = new Schema({
    name: String,
    mini_unit: String,
    mini_price: Number,
    mini_quantity: Number,
    maxi_unit: String,
    maxi_price: Number,
    maxi_quantity: Number,
    category: String,
    cost: Number,
    Total_Cost: {
        type: Number,
        _id: false
    },
}, { _id: false});

// module.exports = mongoose.model('Try', OrderSchemaa);
