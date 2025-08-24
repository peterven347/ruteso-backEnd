const mongoose = require("mongoose")
const Schema = mongoose.Schema

const stockSchema = new Schema({
    item_id: {
        type: Schema.Types.ObjectId,
        ref: "Product"
    },
    stock: Number,
    price: Number,
    info: String
}, {timestamps: true})

module.exports = mongoose.model("Stock", stockSchema)