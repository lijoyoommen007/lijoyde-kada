const { response } = require("express")
const session = require("express-session")
const productHelpers = require('../helpers/product-helpers')
const loginHelpers = require('../helpers/loginHelpers')
const router = require("express").Router()
require('dotenv').config
const fileupload=require('express-fileupload')
const { done } = require("express-hbs/lib/resolver")
router.use(fileupload())
var db = require('../config/connection')
const { order } = require("paypal-rest-sdk")
const adminHelpers = require("../helpers/adminHelpers")
var objectid = require('mongodb').ObjectId


const adminInfo = {
    email : process.env.ADMIN_EMAIL,
    password : process.env.ADMIN_PASSWORD,
}

const verifyLogin = (req,res,next)=>{
  try{
    if(req.session.loggedIn){
        next()
    }else{
        res.redirect('/admin/login')
    }
  }catch{
    res.redirect('/error')
  }
}





router.get('/login',(req,res)=>{
  try{
    if(req.session.loggedIn){
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.redirect('/admin/dashboard')
    }else{
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.render('admin/login',{'invUser': req.session.invUser,admin:true})
    req.session.invUser=false
    }
  }catch{
    res.redirect('/error')
  }
})

router.get('/viewusers',verifyLogin,(req,res)=>{
    if(req.session.loggedIn){
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
           loginHelpers.getAllUser().then((User)=>{
            // console.log(User);
            res.render('admin/adminHome',{User,admin:true});
        })
    }else{
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.redirect('/admin/login')
    }
})


router.post('/login',(req,res)=>{
    if(req.session.loggedIn){
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.redirect('/admin/dashboard')
    }else{
       if(req.body.email == adminInfo.email && req.body.password == adminInfo.password ){
          req.session.loggedIn = true
          res.redirect('/admin/dashboard')
       }else{
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        req.session.invUser=true
        res.redirect('/admin/login')
    }
}
})

router.get('/adminlogout',(req,res)=>{
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    req.session.loggedIn=false
    res.redirect('/admin/login')
})


// router.get('/home',(req,res)=>{
//     productHelpers.getAllUser().then((User)=>{
//         // console.log(User);
//         res.render('admin/adminHome',{User});
//     })
    
// })

router.get('/blockuser/:id',verifyLogin,(req,res)=>{
    let UserId=req.params.id
    adminHelpers.blockUser(UserId).then(()=>{
        console.log('user is blocked')
        res.redirect('/admin/viewusers')
    })

})

router.get('/unblockuser/:id',verifyLogin,(req,res)=>{
    let UserId = req.params.id
    adminHelpers.unblockUser(UserId).then(()=>{
        console.log('user is unBlocked')
        res.redirect('/admin/viewusers') 
    })
})


router.get('/viewproduct',verifyLogin,(req,res)=>{
    adminHelpers.viewProducts().then((Product)=>{
        
        res.render('admin/view-product',{Product,admin:true})

    })
})
router.get('/add-product',verifyLogin,(req,res)=>{
    adminHelpers.viewCategory().then((category)=>{
        res.render('admin/addproducts',{category,'success':req.session.updateStatus,admin:true})
    req.session.updateStatus=false

    })
    
})
router.post('/add-newproduct',(req,res)=>{
    // console.log(req.body); 
    // console.log(req.files.image);
       
    adminHelpers.addProduct(req.body,(id)=>{
        let image=req.files.image
        console.log(id)
       image.mv('./public/productimage/'+id+'.jpg',(err,done)=>{
        if(!err){
          req.session.updateStatus="Product added successfully"
          res.redirect('/admin/add-product');
        }else{
          console.log(err)
        }
       })
       })
      })
      
router.get('/editproduct/:id',verifyLogin,async(req,res)=>{
  console.log(req.params.id)
    let user = await adminHelpers.getuserdetails(req.params.id)
    let category = await adminHelpers.viewCategory()
    res.render('admin/editproduct',{user,category,admin:true})
    })

router.post('/editproduct/:id',(req,res)=>{
    adminHelpers.updateuser(req.params.id,req.body).then(()=>{
        res.redirect('/admin/viewproduct')
       try{
            let image = req.files.image
            image.mv('./public/productimage/'+req.params.id+'.jpg')
        }catch{

        }
    }) 
})
router.get('/deleteproduct/:id',verifyLogin,(req,res)=>{
    adminHelpers.deleteuser(req.params.id).then((response)=>{
        res.redirect('/admin/viewproduct')
    })
})

router.get('/category',verifyLogin,(req,res)=>{
    adminHelpers.viewCategory().then((category)=>{
        res.render('admin/category',{category,admin:true})
    })
})

router.post('/addcategory',(req,res)=>{
    adminHelpers.addCategory(req.body).then(()=>{
        res.redirect('/admin/category')
    })
})

router.get('/deletecategory/:id',verifyLogin,(req,res)=>{
    adminHelpers.deleteCategory(req.params.id).then(()=>{
        res.redirect('/admin/category')
    })
})


router.get('/orders',verifyLogin,async(req,res)=>{
    let orders = await adminHelpers.getAllOrders()
    
    // console.log(orders)

    res.render('admin/orders',{orders,admin:true})
})

router.post('/set-status',(req,res)=>{
    adminHelpers.changeStatus(req.body).then(()=>{
        res.json(response)
    })
}),



router.get('/dashboard',verifyLogin,async(req,res)=>{
    let most = await productHelpers.mostSaledProduct()
    let min = await productHelpers.leastSaledProduct()
    let user =await productHelpers.getUserDetails()
    console.log((req.session.userOrders));

    let latestorder = await productHelpers.getLatestOrder()
        let total = 0
        let newDate = []
        no= 0
        let u_no =0
        await adminHelpers.getAllOrders().then((orders)=>{
           orders.forEach(data => {
         
       if(data.status=='Delivered'){
        no++
        total=total+data.totalAmount
       }
          
           });
          
         })
       await productHelpers.getAllUser().then(async(users)=>{
        users.reverse()
        let newUsers = []
        let newTrans = []
        for (let index = 0; index < 5; index++) {
          newUsers.push(users[index])
          
        }
        users = newUsers
         await adminHelpers.getAllOrders().then((orders) => {
            for (let index = 0; index < 3; index++) {
              newTrans.push(orders[index])
              
            }
            orders = newTrans
           
              users.forEach(data => {
         
                u_no++
               
           
                });
          res.render('admin/dashboard',{admin:true,total,users,orders,no,u_no,most,min,user,latestorder,'userOrders':req.session.userOrders,'err':req.session.userErr});
          req.session.userOrders=false
          req.session.userErr=false
        });
     
          
        })
   

})

router.get("/stats",verifyLogin, async (req, res) => {
    const today = new Date();
    const latYear = today.setFullYear(today.setFullYear() - 1);
  
    try {
      const data = await  db.get().collection('order').aggregate([
        {
            $match:{status:'Delivered'}
        },
        {
        
          $project: {
            month: { $month: "$Date" },
            total:"$totalAmount"
          },
        },
        {
          $group: {
            _id: "$month",
            total: { $sum: "$total" },
          },
        },
      ]).sort({ _id: -1 }).toArray();
      res.status(200).json(data)
    } catch (err) {
      //res.json(err);
      console.log(err);
    }
  });
  
  router.get("/stats2",verifyLogin, async (req, res) => {
    const today = new Date();
    const latYear = today.setFullYear(today.setFullYear() - 1);
  
    try {
      const data = await  db.get().collection('order').aggregate([
        {
            $match:{status:'Delivered'}
        },
        {
        
          $project: {
            week: { $week: "$Date" },
            total:"$totalAmount"
          },
        },
        {
          $group: {
            _id: "$week",
            total: { $sum: "$total" },
          },
        },
      ]).sort({ _id: -1 }).toArray();
      res.status(200).json(data)
    } catch (err) {
      //res.json(err);
      console.log(err);
    }
  });
  router.get("/stats3",verifyLogin, async (req, res) => {
    const today = new Date();
    const latYear = today.setFullYear(today.setFullYear() - 1);
  
    try {
      const data = await  db.get().collection('order').aggregate([
        {
            $match:{status:'Delivered'}
        },
        {
        
          $project: {
            dayOfMonth: { $dayOfMonth: "$Date" },
            total:"$totalAmount"
          },
        },
        {
          $group: {
            _id: "$dayOfMonth", 
            total: { $sum: "$total" },
          },
        },
      ]).sort({ _id: -1 }).toArray();
      res.status(200).json(data)
    } catch (err) {
      //res.json(err);
      console.log(err);
    }
  });
  
  router.get("/stats4",verifyLogin, async (req, res) => {
    const today = new Date();
    const latYear = today.setFullYear(today.setFullYear() - 1);
  
    try {
      const data = await  db.get().collection('order').aggregate([
        {
            $match:{status:'Delivered'}
        },
        {
          $project: {
            year: { $year: "$Date" },
            total:"$totalAmount"
          },
        },
        {
          $group: {
            _id: "$year",
            total: { $sum: "$total" },
          },
        },
      ]).sort({ _id: -1 }).toArray();
      res.status(200).json(data)
    } catch (err) {
      //res.json(err);
      console.log(err);
    }
  });

  router.get("/piechart",verifyLogin,async(req,res)=>{
    try{
      let codCount=0
      let razorPay=0
      let payPal=0
      const order = await adminHelpers.getAllOrders()
      for(let obj in order){
        if(order[obj].status === 'Delivered'){
          order[obj].paymentMethod === 'COD'?codCount++: order[obj].paymentMethod === 'RazorPay'?razorPay++: payPal++
        }     
        
      }
      let respo = {cod:codCount,raz:razorPay,pal:payPal}
      console.log(respo);
      res.json(respo)
    }catch(err){
      // res.status(500).json(err);
      console.log(err);
    }
  })





  router.get('/get-order-details',verifyLogin,async(req,res)=>{
    let orders = await adminHelpers.getAllOrders()
    res.json(orders)
  })

  router.get('/view-category-offers',verifyLogin,async(req,res)=>{
    let category= await adminHelpers.getOffers()
    res.render('admin/categoryOffers',{admin:true,category})
  })
  
  router.get('/add-categoryOffers',verifyLogin,async(req,res)=>{
    let category = await adminHelpers.getOffers()
    res.render('admin/addCategoryoffers',{category,admin:true,'err':req.session.err})
    req.session.err=false
  }),

  router.post('/addcategoryOffers',async(req,res)=>{
    console.log(req.body)
    await adminHelpers.categoryOffers(req.body).then(()=>{
        res.redirect('/admin/view-category-offers')
    }).catch((err)=>{
      req.session.err=err
      res.redirect('/admin/add-categoryOffers')
    })
  })

  router.get('/disableCategoryOffer/:id',verifyLogin,async(req,res)=>{
    await adminHelpers.disableCategoryOffers(req.params.id).then(()=>{
      res.redirect('/admin/view-category-offers')
    })
  })

  router.get('/EnableCategoryOffer/:id',verifyLogin,async(req,res)=>{
    await adminHelpers.enableCategoryOffers(req.params.id).then(()=>{
      res.redirect('/admin/view-category-offers')
    })
  })

  router.get('/deletecategoryoffers/:id',verifyLogin,async(req,res)=>{
    await adminHelpers.deleteCategoryOffers(req.params.id) 
    res.redirect('/admin/view-category-offers')

  })

  router.get('/view-coupenOffers',verifyLogin,async(req,res)=>{
    let offer = await adminHelpers.getAllCoupons()
    console.log(offer);
    res.render('admin/coupon',{admin:true,offer})
  })

  router.get('/add-offerPrice',verifyLogin,async(req,res)=>{
    res.render('admin/addCopen',{admin:true,'err':req.session.err})
    req.session.err=false
  })

  router.post('/addCoupenOffers',async(req,res)=>{
    console.log(req.body);
    await adminHelpers.addCoupenOffers(req.body).then(()=>{
      res.redirect('/admin/view-coupenOffers')
    }).catch((err)=>{
      req.session.err=err
      res.redirect('/admin/add-offerPrice')
    })
    
  }),

  router.get('/disableCoupenOffer/:id',verifyLogin,async(req,res)=>{
    await adminHelpers.disableCouponOffer(req.params.id).then(()=>{
      res.redirect('/admin/view-coupenOffers') 
    })
  }), 

  router.get('/EnableCouponsOffer/:id',verifyLogin,async(req,res)=>{
    await adminHelpers.enableCouponOffer(req.params.id).then(()=>{
      res.redirect('/admin/view-coupenOffers')
    })
  })

  router.post('/searchuser',async(req,res)=>{
    console.log(req.body.userEmail);
    await adminHelpers.searchUser(req.body).then((userOrders)=>{
      if(userOrders[0]){
        req.session.userOrders=userOrders
        res.redirect('/admin/dashboard')
      }else{
        err='User DoesNot Have Any offers yet'
        console.log(err);
        req.session.userErr=err
        res.redirect('/admin/dashboard')
      }
      
      
      })
  })


 

module.exports = router 