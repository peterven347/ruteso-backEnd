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
    // mini_quantity: {
    //     type: Number,
    //     required: true,
    // },
    maxi_unit: {
        type: String,
    },
    maxi_price: {
        type: Number,
    },
    // maxi_quantity: {
    //     type: Number,
    // },
    // cost: {
    //     type: Number,
    //     default: 1
    // },
    total_stock: {
        type: Number,
        min: 0,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    per: {
        type: Number,
        default: 1
    },
    img: {
        type: String,
    },
    exp_date: {
        type: Date,
        required: true,
        default: Date.now
    }
},)

const Product = mongoose.model("Product", productSchema)
const ProductX = mongoose.model("unavailable_product", productSchema)
module.exports = { Product, ProductX }
