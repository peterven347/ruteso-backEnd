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
    firstName: {
        type: String,
        required: true,
    },
    // lastName: {
    //     type: String,
    //     required: true,
    // },
    // address: {
    //     type: String,
    //     required: true,
    // },
    eMail: {
        type: String,
        required: true,
    },
    // phoneNumber: {
    //     type: Number,
    //     required: true,
    // },
    password: {
        type: String,
        required: true,
	},
    cart: [{
        type: String
    }]
}, {timestamps: true})

module.exports = mongoose.model("Customer", userSchema)