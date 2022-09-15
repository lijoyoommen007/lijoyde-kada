var db = require('../config/connection')
const bcrypt=require('bcrypt')
const Razorpay = require('razorpay')
const paypal = require('paypal-rest-sdk')
const session = require('express-session')
const moment = require('moment')
const { resolve } = require('path')
const { response } = require('express')
const { resolveAny } = require('dns')
var objectid = require('mongodb').ObjectId


module.exports={
    blockUser:(UserId)=>{
        return new Promise(async(resolve,reject)=>{
            try{
            await db.get().collection('user').updateOne({_id:objectid(UserId)},{
                $set:{
                    isBlocked:true
                }
            }).then((response)=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        }catch{
         reject()
        }
    })
    
    },

    unblockUser:(UserId)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection('user').updateOne({_id:objectid(UserId)},{
                $set:{
                    isBlocked:false
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    viewProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection('product').find().toArray()
            resolve(users)
        })

    },

    viewCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection('category').find().toArray()
            resolve(users)
        })

    },

    addProduct:async(productData,callback)=>{
        // console.log(productData)
        let prices = parseInt(productData.price)
        let offerprices = parseInt(productData.offerprice)
        let stocks = parseInt(productData.stock)
       let productInfo={
         productname :  productData.productname,
         description: productData.description,
         category : productData.category,
         price : prices,
         offerprice:offerprices,
         stock : stocks,
       }

       db.get().collection('product').insertOne(productInfo).then((data)=>{
            callback(data.insertedId)
        }).catch((err)=>{
            console.log(err)
        })

    },

    getuserdetails:(User)=>{
        return new Promise(async(resolve,reject)=>{
            let user = await db.get().collection('product').findOne({_id:objectid(User)})
            resolve(user);  
        })
    },

    viewCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection('category').find().toArray()
            resolve(users)
        })

    },

    updateuser:(userid,userdetails)=>{
        let stock = parseInt(userdetails.stock)
        let price = parseInt(userdetails.price)
        let offerprice = parseInt(userdetails.offerprice)
        return new Promise(async(resolve,reject)=>{
            db.get().collection('product').updateOne({_id:objectid(userid)},{
                $set:{
                    productname:userdetails.productname,
                    description:userdetails.description,
                    stock:stock,
                    category:userdetails.category,    
                    price:price,
                    offerprice:offerprice
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    deleteuser:(userid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('product').deleteOne({_id:objectid(userid)}).then(()=>{
                resolve()

            })
        })
    },

    addCategory:(categoryData)=>{
        return new Promise (async(resolve,reject)=>{
          let category =  await db.get().collection('category').insertOne(categoryData)
          resolve(category)       
        })
            
    },

    deleteCategory:(userid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('category').deleteOne({_id:objectid(userid)}).then(()=>{
            resolve()

            })
        })
    },

    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection('order').find().sort({'_id':-1}).toArray()
            resolve(orders);
        }) 
    },

    getOffers: () => {
        return new Promise((resolve, reject) => {
            let date = new Date()
            let currentDate = moment(date).format('YYYY-MM-DD')
            db.get().collection('category').find().toArray().then((categories) => {
                for (let i in categories) {
                    if (categories[i].offer) {
                        if (categories[i].offer.validtill <= currentDate) {
                            db.get().collection('category').findOneAndUpdate({ _id: objectid(categories[i]._id) },
                                {
                                    $set: {
                                        "offer.isEnabled": false,
                                        "offer.isExpired": true,
                                    }
                                })
                        }
                    }
                }
            })
            db.get().collection('category').find().toArray().then((category) => {
                resolve(category)
            })
        })

    },

    changeStatus:(details)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection('order')
            .updateOne({_id:objectid(details.orderId)}, 
            {
                $set:{status:details.status}
            }
          ).then((response)=>{ 
            resolve(response)
          })
        })
    },

    categoryOffers:(offerData) => {
        return new Promise(async (resolve, reject) => {
            let query = objectid(offerData.categoryId)
            let categories = await db.get().collection('category').findOne(query)
            if (categories.offer) {
                let err = "The selected category already have an offer"
                reject(err)
            } else {
                offerData.percent = parseFloat(offerData.percent)
                offerData.isEnabled = true
                offerData.isExpired = false
                db.get().collection('category').findOneAndUpdate({ _id: objectid(query) }, {
                    $set: { offer: offerData }
                }).then((data => {
                    resolve()
                })).catch((err) => {
                    reject(err)
                })
            }

        })
    },

    disableCategoryOffers:(Id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('category').updateOne({_id:objectid(Id)},
            {
                $set:{
                    'offer.isEnabled':false,
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    enableCategoryOffers:(Id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('category').updateOne({_id:objectid(Id)},
            {
                $set:{
                    'offer.isEnabled':true,
                }
            }).then(()=>{
                resolve()
            })
        })
    },

    deleteCategoryOffers:(Id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('category').findOneAndUpdate({_id:objectid(Id)},
            {
                $unset:{offer:""}
            }).then(()=>{
                resolve()
            })
        })
    },

    getAllCoupons: () => {
        return new Promise((resolve, reject) => {
            let date = new Date()
            let currentDate = moment(date).format('YYYY-MM-DD')
            db.get().collection('Coupens').find().toArray().then((couponData) => {
                for (let i in couponData) {
                    if (couponData[i].valid_till <= currentDate) {
                        db.get().collection('Coupens').findOneAndUpdate({ _id: objectid(couponData[i]._id) },
                            {
                                $set: {
                                    "status": false,
                                    "isExpired": true,
                                }
                            })
                        couponData[i].status = false
                        couponData[i].isExpired = true
                    } else if (couponData[i].valid_till > currentDate) {
                        db.get().collection('Coupens').findOneAndUpdate({ _id: objectid(couponData[i]._id) },
                            {
                                $set: {
                                    "isExpired": false,
                                }
                            })
                        couponData[i].isExpired = false
                    }
                }
                
                resolve(couponData)

            })
        })
    },

    addCoupenOffers:(details)=>{
        return new Promise(async(resolve,reject)=>{
            coupens =await db.get().collection('Coupens').findOne({'coupenCode':details.coupenCode})
            if(coupens){
                    err='Coupen Code Already Exist'
                    reject(err)
            
            
            }else{
                details.amount = parseFloat(details.amount)
                details.minimum= parseFloat(details.minimum)
                details.isEnabled = true
                details.isExpired = false
                db.get().collection('Coupens').insertOne(details).then(()=>{
                    resolve()
                }).catch((err)=>{
                    reject(err)
                })
            }
        })
    },
    disableCouponOffer:(Id)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection('Coupens').updateOne({_id:objectid(Id)},
            {
                $set:{'isEnabled':false}
            }).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        })
    },

    enableCouponOffer:(Id)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection('Coupens').updateOne({_id:objectid(Id)},
            {
                $set:{'isEnabled':true}
            }).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        })
    },

    searchUser:(users)=>{
        console.log(users.userEmail);
            return new Promise((resolve,reject)=>{
                db.get().collection('user').findOne({email:users.userEmail}).then(async(user)=>{
                let userOrders = await db.get().collection('order').find({userId:objectid(user._id)}).toArray()
                resolve(userOrders)
            })
        })
       
    }





}