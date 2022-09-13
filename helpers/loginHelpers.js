var db = require('../config/connection')
const bcrypt=require('bcrypt')
const Razorpay = require('razorpay')
const paypal = require('paypal-rest-sdk')
const session = require('express-session')
const moment = require('moment')
const { resolve } = require('path')
const { response } = require('express')


module.exports={
    getAllUser:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection('user').find().toArray()
            resolve(users)
        })
    },
}