var db = require('../config/connection')
const bcrypt=require('bcrypt')
const Razorpay = require('razorpay')
const paypal = require('paypal-rest-sdk')
const session = require('express-session')
const moment = require('moment')
const { resolve } = require('path')
const { response } = require('express')


paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': '####yourclientid######',
    'client_secret': '####yourclientsecret#####'
  }); 

var instance = new Razorpay({
    key_id:'rzp_test_ilbozCbF2qsKox',
    key_secret:'F0UgFumzdIyVIArgI0MY1fwG',
})

var objectid = require('mongodb').ObjectId

module.exports={
    doSignup:(userData)=>{
        

        return new Promise(async(resolve,reject)=>{
            
            var userCheck=await db.get().collection('user').findOne({email:userData.email})
            if(userCheck){
                let err='Email Already Existed'
                reject(err)
            }else{
                userData.respassword = await bcrypt.hash(userData.repeatpassword,10)
                userData.password=await bcrypt.hash(userData.password,10)
                db.get().collection('user').insertOne(userData).then((data)=>{
                resolve(data)
           })
        }
        
        })
    
    }, 
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response ={}
            let user=await db.get().collection('user').findOne({email:userData.email})
            
            if(user){
                if(user.isBlocked==true){
                    let err="User Is Blocked Contact Us"
                    reject(err)
                }else{
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log(user.email+' connected to server')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                    else{
                        err='invalied email or password'
                        reject(err)
                    }
                })
            }
            }else{
                err='invalied email or password'
                reject(err,{status:false})
            }
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

    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            
            var userCheck=await db.get().collection('user').findOne({email:userData.email})
            if(userCheck){
                let err='Email Already Existed'
                reject(err)
            }else{
                userData.password=await bcrypt.hash(userData.password,10)
                db.get().collection('user').insertOne(userData).then((data)=>{
                resolve(data)
           })
        }
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection('product').find().toArray()
            resolve(users)
        })
    },
    deleteuser:(userid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('product').deleteOne({_id:objectid(userid)}).then(()=>{
                resolve()

            })
        })
    },
    getuserdetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection('product').findOne({_id:objectid(userId)}).then((user)=>{
                resolve(user)
            })
        })
    },
    getAllUser:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection('user').find().toArray()
            resolve(users)
        })
    },
    
    
        blockUser:(UserId)=>{
            return new Promise(async(resolve,reject)=>{
                await db.get().collection('user').updateOne({_id:objectid(UserId)},{
                    $set:{
                        isBlocked:true
                    }
                }).then((response)=>{
                    resolve()
                })
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

        addCategory:(categoryData)=>{
            return new Promise (async(resolve,reject)=>{
              let category =  await db.get().collection('category').insertOne(categoryData)
              resolve(category)       
            })
                
        },
        viewCategory:()=>{
            return new Promise(async(resolve,reject)=>{
                let users=await db.get().collection('category').find().toArray()
                resolve(users)
            })
    
        },
        deleteCategory:(userid)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection('category').deleteOne({_id:objectid(userid)}).then(()=>{
                resolve()
    
                })
            })
        },

        getProductdetails:(userId)=>{
            return new Promise(async(resolve,reject)=>{
               let productDetails =await db.get().collection('product').findOne({_id:objectid(userId)})
               let proCat = await db.get().collection('category').findOne({categoryname:productDetails.category})
               db.get().collection('product').find({category:productDetails.category}).toArray().then((allProduct)=>{

                let response = {
                    productDetail:productDetails,
                    allProducts:allProduct,
                    proCat:proCat
                }
                resolve(response)
                  })
               
                })
        },

        showCategory:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let category = await db.get().collection('category').findOne({_id:objectid(userId)})
                db.get().collection('product').find({category:category.categoryname}).toArray().then((allCategory)=>{
                    resolve(allCategory)

                })
            })

        },

        addToCart:(prodId,userId,name,offer)=>{
            let proObj = {
                item:objectid(prodId),
                quantity:1,
                productName:name,
                subTotal:parseFloat(offer)
            }
            return new Promise(async(resolve,reject)=>{
                let userCart = await db.get().collection('cart').findOne({user:objectid(userId)}) 
                if(userCart){
                    let proExist = userCart.products.findIndex(product=>product.item==prodId)
                    if(proExist!=-1){
                        db.get().collection('cart')
                        .updateOne({user:objectid(userId),'products.item':objectid(prodId)},
                        {
                            $inc:{'products.$.quantity':1}
                        }
                        ).then(()=>{
                            resolve()
                        })
                    }else{
                    db.get().collection('cart')
                    .updateOne({user:objectid(userId)},
                        {
                                $push:{products:proObj}                      
                        }
                    ).then((response)=>{
                        resolve()
                    })
                }
                }else{
                    let cartobj = {
                        user:objectid(userId),
                        products:[proObj]
                    }
                    db.get().collection('cart').insertOne(cartobj).then((response)=>{
                        resolve()
                    })
                }
            })
        },

        getCartProducts:(userId)=>{
            
            return new Promise(async(resolve,reject)=>{
               let cartItems = await db.get().collection('cart').aggregate([
                {
                    $match:{user:objectid(userId)}
                },

                {
                    $unwind:'$products'
                },

                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        subTotal:'$products.subTotal'
                    }
                },

                {
                    $lookup:{
                        from:'product',
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,subTotal:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
               

               ]).toArray()
               resolve(cartItems)
            })
        },


        getCartCount:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let count = 0
                let cart = await db.get().collection('cart').findOne({user:objectid(userId)})
                if(cart){
                    count=cart.products.length
                }
                resolve(count)
            })
        },


        changeProductQuantity: (details) => {
            count = parseInt(details.count)
            quantity = parseInt(details.quantity)
    
            return new Promise(async (resolve, reject) => {
                // let userCart = await db.get().collection('cart')
                //     .updateOne({ _id: objectid(details.cartId), 'products.item': objectid(details.proId) },
                //         {
                //             $set: { 'products.$.subtotal': details.subtotal }
                //         }
                //     )
                if (count == -1 && quantity == 1) {
                    db.get().collection('cart')
                        .updateOne({ _id: objectid(details.cartId) },
                            {
                                $pull: { products: { item: objectid(details.proId) } }
                            } 
                        ).then((response) => {
                            //    console.log(response)
                            resolve({ removeProduct: true })
                        })
                } else {
                    db.get().collection('cart')
                        .updateOne({ _id: objectid(details.cartId), 'products.item': objectid(details.proId) },
                            {
                                $inc: { 'products.$.quantity': count }
                            }
                        ).then((response) => {
                            resolve({ change: true })
                        })
                }
    
        })
        },
        deleteCartProduct:(details)=>{
            return new Promise(async (resolve, reject) => {

            db.get().collection('cart')
             .updateOne({ _id: objectid(details.cartId) },
                 {
                     $pull: { products: { item: objectid(details.proId) } }
                 }
             ).then((response) => {
                 resolve({ removeProduct: true })
             })

            })
        },

        getTotalAmount:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let total = await db.get().collection('cart').aggregate([
                 {
                     $match:{user:objectid(userId)}
                 },
 
                 {
                     $unwind:'$products'
                 },
 
                 {
                     $project:{
                         item:'$products.item',
                         quantity:'$products.quantity',
                         subTotal:'$products.subTotal'
                     }
                 },
 
                 {
                     $lookup:{
                         from:'product',
                         localField:'item',
                         foreignField:'_id',
                         as:'product'
                     }
                 },
                
                 {
                     $project:{
                         item:1,quantity:1,subTotal:1,product:{$arrayElemAt:['$product',0]}
                     }
                 },

                 {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$subTotal']}}
                    }
                 }
                
 
                ]).toArray()
                resolve(total)
             })  
        }, 

        placeOrder:(order,userId,products,total)=>{
            return new Promise((resolve,reject)=>{
                let status = order['payment-method'] === 'COD'?'Placed':'Pending'
                let fdate = moment(new Date).format('YYYY-MM-DD')
                let orderObj = {
                    deliveryDetails:{
                        name:order.name,
                        address:order.address,
                        mobile:order.number,
                        city:order.city, 
                        pincode:order.pincode
                    },
                    userId:objectid(userId),
                    paymentMethod:order['payment-method'],
                    products:products,
                    totalAmount : total,
                    status:status,
                    date:fdate,
                    Date:new Date
                }

                db.get().collection('order').insertOne(orderObj).then((response)=>{
                    db.get().collection('cart').deleteOne({user:objectid(userId)}).then(()=>{
                        resolve(response.insertedId)
                    })
                })

            }) 
        },

        getCartProductList:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let cart = await db.get().collection('cart').findOne({user:objectid(userId)})
                resolve(cart.products)
            })
        },

        getAllOrders:()=>{
            return new Promise(async(resolve,reject)=>{
                let orders = await db.get().collection('order').find().sort({'_id':-1}).toArray()
                resolve(orders);
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

        getUserdetails:(User)=>{
            return new Promise(async(resolve,reject)=>{
                let user = await db.get().collection('user').findOne({_id:objectid(User._id)})
                resolve(user);
            })
        },

        getuserdetails:(User)=>{
            return new Promise(async(resolve,reject)=>{
                let user = await db.get().collection('product').findOne({_id:objectid(User)})
                resolve(user);  
            })
        },
        getuserDetails:(User)=>{
            return new Promise(async(resolve,reject)=>{
                let user = await db.get().collection('product').findOne({_id:objectid(User._id)})
                resolve(user);  
            })
        },

        editAccountDetails:(userDetails,user)=>{
            return new Promise(async(resolve,reject)=>{
            var userCheck=await db.get().collection('user').findOne({_id:{$ne:objectid(userDetails.userId)},email:userDetails.email})
            if(userCheck){
                let err='Email Already Existed'
                reject(err)
            }else{
                bcrypt.compare(userDetails.password,user.password).then((status)=>{
                    if(status){
                        db.get().collection('user').updateOne({_id:objectid(userDetails.userId)},
                        {
                            $set:
                            {
                                name:userDetails.name,
                                email:userDetails.email
                            },
                        }
                        ).then(()=>{
                            success='Changes Updated'
                            resolve(success)
                        })
                    }else{ 
                        err='invalied password'
                        reject(err)
                    }
                })
            }

            })
            
        },

        changePassword:(user,password)=>{
           return new Promise(async(resolve,reject)=>{
            let userDetails = await db.get().collection('user').findOne({_id:objectid(user._id)})
            await bcrypt.compare(password.currentPassword,userDetails.password).then(async(status)=>{
                 if(status){
                    let newpassword= await bcrypt.hash(password.newPassword,10)
                    db.get().collection('user').updateOne({_id:objectid(user._id)},
                    {
                        $set:
                        {
                            password:newpassword
                        }
                    } 
                    ).then(()=>{
                        success='Password Updated Successfully'
                        resolve(success) 
                    })
                 }else{
                    err='Please Check Your Current Password'
                    reject(err)
                 }
                })
           })
        },

        addNewAddress:(user,Address)=>{
            let address={
                title:Address.title,
                address:Address.address,
                city:Address.city,
                pincode:Address.pincode,
                mobile:Address.mobile
            }
            return new Promise(async(resolve,reject)=>{
                db.get().collection('user').updateOne({_id:objectid(user._id)},
                {
                    $push:{address:address}
                }
                ).then(()=>{
                    success='Address Is Added SuccessFully'
                    resolve(success)
                })
            })
        },

        deleteAddress:(details)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection('user').updateOne({_id:objectid(details.userId)},
                {
                    $pull:{address:{title:details.title}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            })
        },

        generateRazorpay:async(orderId,total,userId)=>{
            let user = await db.get().collection('user').findOne({_id:objectid(userId)})
            return new Promise((resolve,reject)=>{
                var options={
                    amount: total,
                    currency:"INR",
                    receipt:""+orderId
                };
                instance.orders.create(options, function(err,order){
                    if(err){
                        console.log(err)
                    }else{
                        order.user=user
                        resolve(order)
                    }
                     
                })
            })
        },
        verifyPayment:(data)=>{
            return  new Promise((resolve,reject)=>{
                const crypto=require('crypto')
                let hmac=crypto.createHmac('sha256', 'F0UgFumzdIyVIArgI0MY1fwG')
                hmac.update(data['payment[razorpay_order_id]']+'|'+data['payment[razorpay_payment_id]']);
                hmac=hmac.digest('hex')
                if(hmac==data['payment[razorpay_signature]']){
                    resolve()
                }else{
                    reject()
                }
            })
    
        },
       
        changePaymentStatus:(orderId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection("order").updateOne({ _id:objectid(orderId)}, {
                    $set: {
                        status: "Placed",
                    }
            }).then(()=>{
                resolve()
            }).catch((err)=>{
                console.log(err)
                reject(err)
            })
    
        })
    
    },

    mostSaledProduct:()=>{
   return new Promise((resolve,reject)=>{
    db.get().collection('order').aggregate([
        {
            $match: {
                "status": { $eq: "Delivered" }
            }
        },
        {
            $unwind: '$products'
        },
        {
            $group: {
              "_id": "$products.item",
              "name":{"$first":"$products.productName"},
              "sum": {
                "$sum": "$products.quantity"
              }
            }
          },
          {
            "$sort": {
              sum: -1
            }
          },
          {
            "$limit":5
          },
          {
            "$group": {
              _id: null,
              top_selling_products : {
                $push: {"_id":"$_id","sum":"$sum","name":"$name"}
              }
            }
          }
    ]).toArray().then((mostSaled)=>{
        
        resolve(mostSaled[0].top_selling_products)
    })
   })
    },

    leastSaledProduct:()=>{

        return new Promise((resolve,reject)=>{
            db.get().collection('order').aggregate([
                {
                    $match: {
                        "status": { $eq: "Delivered" }
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $group: {
                      "_id": "$products.item",
                      "name":{"$first":"$products.productName"},
                      "sum": {
                        "$sum": "$products.quantity"
                      }
                    }
                  },
                  {
                    "$sort": {
                      sum: 1
                    }
                  },
                  {
                    "$limit":5
                  },
                  {
                    "$group": {
                      _id: null,
                      least_selling_products : {
                        $push: {"_id":"$_id","sum":"$sum","name":"$name"}
                      }
                    }
                  }
            ]).toArray().then((mostSaled)=>{
                
                resolve(mostSaled[0].least_selling_products)
            })
           })

    },

    getUserDetails:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('user').find().sort({'_id':-1}).limit(5).toArray().then((user)=>{
                resolve(user)
            })
        })
    },
    getLatestOrder:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('order').find().sort({'_id':-1}).limit(5).toArray().then((orders)=>{
                resolve(orders)
            })
        })
    },

    getUserOrder:(userId)=>{
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection('order').find({ userId: objectid(userId) }).sort({ date: -1 }).toArray()
            // console.log(orders)
            resolve(orders,) 
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

    addtowishlist:(prodId,userId,name,offer)=>{
        let proObj={
            item:objectid(prodId),
            productName:name,
            subTotal:offer
        }
        return new Promise(async(resolve,reject)=>{
            let wishcart = await db.get().collection('wishList').findOne({user:objectid(userId)})
            if (wishcart) {
                let proExist = wishcart.products.findIndex(product=>product.item==prodId)
                if(proExist!=-1){
                    resolve()
                }else{
                db.get().collection('wishList').updateOne({user:objectid(userId)},
            {
                $push:{products:proObj}
            }).then((response)=>{
                resolve()
            })
            }
            }else{
                let wishcart = {
                    user:objectid(userId),
                    products:[proObj]
                }
                db.get().collection('wishList').insertOne(wishcart).then((response)=>{
                    resolve()
                })
            }
             
        })
    },

    getWishList:(id)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection('wishList').findOne({user:objectid(id)}).then((wishlist)=>{
                resolve(wishlist)
            })
        })
    },

    getWishListProducts:(id)=>{
       
        return new Promise(async(resolve,reject)=>{
            let wishlistItems = await db.get().collection('wishList').aggregate([
             {
                 $match:{user:objectid(id)}
             },

             {
                 $unwind:'$products'
             },

             {
                 $project:{
                     item:'$products.item',
                     subTotal:'$products.subTotal'
                 }
             },

             {
                 $lookup:{
                     from:'product',
                     localField:'item',
                     foreignField:'_id',
                     as:'product'
                 }
             },
             {
                 $project:{
                     item:1,subTotal:1,product:{$arrayElemAt:['$product',0]}
                 }
             }
            

            ]).toArray()
            resolve(wishlistItems)
         })

    },


    deleteWishlistProduct:(details)=>{
        return new Promise(async (resolve, reject) => {

        db.get().collection('wishList')
         .updateOne({ _id: objectid(details.cartId) },
             {
                 $pull: { products: { item: objectid(details.proId) } }
             }
         ).then((response) => {
             resolve({ removeProduct: true })
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
 
    coupenOffers:(coupenCode)=>{
        return new Promise(async(resolve,reject)=>{
           let coupen = await db.get().collection('Coupens').findOne({'coupenCode':coupenCode})
           if(coupen){
             resolve(coupen)
           }else{
            err='Invalied offer code'
            reject(err)
           }
        })
    },

    checkOffer:(userId,couponid,coupencode)=>{
       let details={
            couponId:couponid,
            coupenCode:coupencode
        }
        console.log(details);
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection('userCoupons').findOne({'userId':userId})
            console.log(user);
            if(user){
                db.get().collection('userCoupons').updateOne({'userId':userId},
                {
                   $set:{offer:details} 
                }).then(()=>{
                    resolve()
                })
            }else{
                console.log('reached here');
                db.get().collection('userCoupons').insertOne({userId,offer:details}).then(()=>{
                    resolve()
                })
            }
        })
    },

    checkUserCoupen:(userId,details)=>{
        return new Promise(async(resolve,reject)=>{
            let userOffer = await db.get().collection('userCoupons').findOne({userId:userId})
            console.log(userOffer,'here');
            if(userOffer){
                console.log(userOffer.offer.coupenCode,'here');
              if(userOffer.offer.coupenCode == details){
                  err='You Have Already Used This Coupon'
                  reject(err)
              }else{
                  resolve(userOffer)
              }
          }else{
            resolve()
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
    
    




    
         
} 