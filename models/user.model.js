// const Sequelize = require('sequelize')
// const sequelize = require('../util/database')

// const User = sequelize.define('user', {
//     id:{
//         type: Sequelize.INTEGER,
//         autoIncrement: true,
//         allowNull: false,
//         primaryKey: true
//     },
//     name: Sequelize.STRING,
//     email: Sequelize.STRING
// })

// module.exports = User
const mongoose = require("mongoose")
const Schema = mongoose.Schema

const userSchema = new Schema({
    first_name: {
        type: String,
        required: true,
    },
    // last_name: {
    //     type: String,
    //     required: true,
    // },
    // address: {
    //     type: String,
    //     required: true,
    // },
    email: {
        type: String,
        required: true,
        unique: true
    },
    // phoneNumber: {
    //     type: Number,
    //     required: true,
    // },
    password: {
        type: String,
        required: true,
	},
    last_purchase: {
        type: Object,
        default: {}
    },
    last_purchase_date: Date
}, {timestamps: true})

module.exports = mongoose.model("User", userSchema)