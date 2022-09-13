const { resolve } = require('express-hbs/lib/resolver')

const { callbackPromise } = require('nodemailer/lib/shared')


module.exports={



   getAllUser:()=>{
    return new Promise(async(resolve,reject)=>{
        let users=await db.get().collection('product').find().toArray()
        resolve(users)
    })
},


    blockUser:(UserId)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection('product').updateOne({_id:objectid(UserId)},{
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
            await db.get().collection('product').updateOne({_id:objectid(UserId)},{
                $set:{
                    isBlocked:true
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
        console.log(productData)
       let productInfo={
         productname :  productData.productname,
         category : productData.category,
         price : productData.price,
         stock : productData.stock,
       }

         let prod = new product(productInfo)
         prod.save().then((data)=>{
            console.log(data)
            callback(data.insertedId)
        }).catch((err)=>{
            console.log(err)
        })

    } 




}