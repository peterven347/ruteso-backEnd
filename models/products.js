const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    mini_unit: {
        type: String,
        required: true,
    },
    mini_price: {
        type: Number,
        required: true,
    },
    mini_quantity: {
        type: Number,
        required: true,
        default: 1
    },
    maxi_unit: {
        type: String,
        required: false,
    },
    maxi_price: {
        type: Number,
        required: true,
    },
    maxi_quantity: {
        type: Number,
        required: true,
        default: 0
    },
    cost: {
        type: Number,
        default: 1
    },
    checkState: {
        type: Boolean,
        default: false,
    },
    initialState: {
        type: Boolean,
        default: false,
    },
    category: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true,
    }
},)

module.exports = productSchema
// module.exports = mongoose.model("Item", productSchema)
