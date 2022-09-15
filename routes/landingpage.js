
const productHelpers = require('../helpers/product-helpers');

const router = require('express').Router()

const paypal = require('../helpers/paypal');
const session = require('express-session');
const adminHelpers = require('../helpers/adminHelpers');
let date = new Date


const verifyLogin = (req,res,next)=>{
    if(req.session.logedIn
        ){
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        next()
    }else{
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.redirect('/user/login')
    }
}




router.get('/',async(req,res)=>{
    try{
    if(req.session.logedIn){
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.redirect('/home')
    }else{
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        let product = await productHelpers.getAllProducts()
        let category = await productHelpers.getOffers()
        req.session.category = category;
        
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        
        res.render('user/landingpage',{product,category,admin:true,})
    }
 }catch{
    res.redirect('/error')
 }
})

router.get('/home',async(req,res)=>{
    if(req.session.logedIn){
        req.session.title=false
        let product = await productHelpers.getAllProducts()
        let category = await productHelpers.getOffers()
        req.session.category = category;
        let cartCount =await productHelpers.getCartCount(req.session.user._id)
         req.session.cartcount=cartCount
         let wishlist = await productHelpers.getWishList(req.session.user._id)
        


        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.render('user/home',{product,category,wishlist,admin:false,'cartcount':req.session.cartcount})
        req.session.coupens=false
    }else{
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.redirect('/user/login')
    }
})


router.get('/viewproducts/:id',verifyLogin,async(req,res)=>{
   await productHelpers.getProductdetails(req.params.id).then(async(response)=>{
    let category = await productHelpers.getOffers()
    let productdetails = response.productDetail
    let allProducts = response.allProducts
    let proCat = response.proCat
    if(proCat.offer){
        if(proCat.offer.isEnabled){
        productdetails.offerprice = (productdetails.offerprice*proCat.offer.percent)/100
        }
    }
    console.log(productdetails.offerprice);
    console.log(proCat);
    res.render('user/productdetails',{productdetails,allProducts,category,proCat,'cartcount':req.session.cartcount,admin:false})
   })
 
})

router.get('/viewcategory/:id',verifyLogin,async(req,res)=>{
    let allCategory = await productHelpers.showCategory(req.params.id)
    let category = await productHelpers.getOffers()

        res.render('user/category',{allCategory,category,'cartcount':req.session.cartcount,admin:false})
    })

router.post('/addtocart/:id',(req,res)=>{
    productHelpers.addToCart(req.params.id,req.session.user._id,req.body.name,req.body.offer).then(()=>{
        res.json({status:true})
    })
})

router.get('/cart',verifyLogin,async(req,res)=>{
    let products =await productHelpers.getCartProducts(req.session.user._id)
    console.log(products)
    let total,totalamount
    req.session.title=false
    if(products.length>0){
        totalamount =await productHelpers.getTotalAmount(req.session.user._id)
        total= totalamount[0].total
    }
    res.render('user/cart',{products,'category':req.session.category,'cartcount':req.session.cartcount,total})
    req.session.coupens=false
})


router.post('/change-product-quantity',(req,res)=>{
    // console.log(req.body)
    productHelpers.changeProductQuantity(req.body).then(async(response)=>{
        try{
            total = await productHelpers.getTotalAmount(req.session.user._id)
            response.total=total[0].total
        }catch{

        }
       
      res.json(response)
    })
}),

router.post('/delete-product-from-cart',(req,res)=>{
    // console.log(req.body) 
    productHelpers.deleteCartProduct(req.body).then((response)=>{
        res.json(response)
    })
}),

router.get('/place-order',verifyLogin,async(req,res)=>{
    let totalamount = await productHelpers.getTotalAmount(req.session.user._id)
    let allcoupon = await productHelpers.getAllCoupons()
    let total = totalamount[0].total
    total = parseFloat(total)
    console.log(total,'total');
    console.log(req.session.coupens);
    if (req.session.coupens){
     
         let offerprice = parseFloat(req.session.coupens.amount)
         let minimum = parseFloat(req.session.coupens.minimum)
         console.log(minimum,typeof(minimum));
         if(total >= minimum){
         total = total-offerprice
        }else{
        err='Please purchase for ₹'+minimum+' or above to avail this offer'
        req.session.coupens=false
        req.session.err=err
       }

    
}
    let user = await productHelpers.getUserdetails(req.session.user)
    res.render('user/checkout',{total,user,'orderAddress':req.session.title,'offerAdded':req.session.coupens,'err':req.session.err,allcoupon})
    req.session.err=false
})

router.post('/deliver-here',async(req,res)=>{
    req.session.title=req.body.order_address
    res.redirect('/place-order')
})

router.post('/place-order',async(req,res)=>{
    let products = await productHelpers.getCartProductList(req.session.user._id)
    let total = await productHelpers.getTotalAmount(req.session.user._id)
    total= total[0].total
    if (req.session.coupens){
        let offerprice = parseFloat(req.session.coupens.amount)
        let minimum = parseFloat(req.session.coupens.minimum)
        console.log(minimum,typeof(minimum));
        if(total >= minimum){
            total = total-offerprice
            await productHelpers.checkOffer(req.session.user._id,req.session.coupens._id,req.session.coupens.coupenCode)
            console.log(total,'post'); 
        }else{
            err='Please purchase for'+minimum+'to avail this offer'
            req.session.err=err
        }
    }
    
    productHelpers.placeOrder(req.body,req.session.user._id,products,total).then((orderId)=>{ 
        req.session.title=false
        if(req.body['payment-method']==='COD'){
            res.json({codSuccess:true})
        }else if(req.body['payment-method']==='RazorPay') {
            console.log('evde vanne')
            productHelpers.generateRazorpay(orderId,total,req.session.user._id).then((order)=>{
            res.json({order})
            })
        }else if(req.body['payment-method']==='payPal'){
            productHelpers.changePaymentStatus(orderId).then((response)=>{
                res.json({paypal:true})
            })
        }
            
    })
    req.session.success=false
    req.session.coupens=false
});

router.post('/verify-payment', verifyLogin, (req, res) => {
    productHelpers.verifyPayment(req.body).then((response) => {
        console.log(req.body['order[receipt]']);
      productHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
        console.log('payment successfull')
        res.json({ status: true })
      })
    }).catch((err) => {
      console.log(err)
      res.json({ status: false, errMsg: '' })
    })
  })

router.get('/orders',verifyLogin,async(req,res)=>{
    let orders = await productHelpers.getUserOrder(req.session.user._id).catch(()=>{
        res.redirect('/error')
    })
    res.render('user/orders',{orders,admin:false}) 
})

router.get('/account',verifyLogin,async(req,res)=>{
    let user = await productHelpers.getUserdetails(req.session.user)

    res.render('user/accounts',{user,'category':req.session.category,'err':req.session.err,'success':req.session.success})
    req.session.err=false
    req.session.success=false
})

router.post('/edit-account-info',(req,res)=>{
    productHelpers.editAccountDetails(req.body,req.session.user).then((success)=>{
        req.session.success = success
        res.redirect('/account') 
    }).catch((err)=>{
        
        req.session.err=err
        res.redirect('/account')
    })
})

router.post('/changepassword',(req,res)=>{
    productHelpers.changePassword(req.session.user,req.body).then((success)=>{
        req.session.success=success
        res.redirect('/account')
    }).catch((err)=>{
        req.session.err=err
        res.redirect('/account')

    })
}),

router.post('/addnewaddress',(req,res)=>{
    productHelpers.addNewAddress(req.session.user,req.body).then((success)=>{
        req.session.success=success
        res.redirect('/account')
    })
    
}),
router.post('/addnewaddress1',(req,res)=>{
    productHelpers.addNewAddress(req.session.user,req.body).then((success)=>{
        req.session.success=success
        res.redirect('/place-order')
    })
}),

router.post('/delete-address',(req,res)=>{
    productHelpers.deleteAddress(req.body).then((response)=>{
        res.json(response)
    })
}),

router.post("/api/orders", async (req, res) => {
    const order = await paypal.createOrder();
    res.json(order);
  });

  router.post("/api/orders/:orderId/capture", async (req, res) => {
    const { orderId } = req.params;
    const captureData = await paypal.capturePayment(orderId);
    res.json(captureData);
  });

  router.get('/ordersuccesful',(req,res)=>{
    res.render('user/orderSuccessfully')
  })  


  router.get('/wishlist',async(req,res)=>{
    let products =await productHelpers.getWishListProducts(req.session.user._id)
    res.render('user/wishList',{products})
  })

  router.post('/addtowishlist/:id',async(req,res)=>{
    await productHelpers.addtowishlist(req.params.id,req.session.user._id,req.body.name,req.body.offer).then(()=>{
        res.json()
    })
  })


  router.post('/delete-product-from-wishlist',(req,res)=>{
    productHelpers.deleteWishlistProduct(req.body).then((response)=>{
        res.json(response)
    })
}),

router.post('/coupencheck',async(req,res)=>{
    let coupon = req.body.coupencode.trim()
    await productHelpers.getAllCoupons()
    await productHelpers.coupenOffers(coupon).then(async(coupens)=>{
        await productHelpers.checkUserCoupen(req.session.user._id,coupon).then((userCoupons)=>{
        if(coupens.isEnabled == true ){
            req.session.coupens=coupens
            res.redirect('/place-order')
            }else{
                err='Coupon Expired or Not In Use'
                req.session.coupens=false
                req.session.err=err
                res.redirect('/place-order')
            }
        }).catch((err)=>{
            req.session.err=err
            console.log(err);
            res.redirect('/place-order')
        })
        
    }).catch((err)=>{
        console.log(err);
        req.session.err=err
        res.redirect('/place-order')
    })
})

router.get('/addressAgain',(req,res)=>{
    req.session.title=false
    res.redirect('/place-order')
})

 
module.exports=router 