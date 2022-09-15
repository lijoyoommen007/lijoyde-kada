const router = require("express").Router()
const producthelper = require('../helpers/product-helpers')

const bcryt = require('bcrypt')
const { response } = require("express")
require('dotenv').config()
const jwt = require("jsonwebtoken")
const crypto = require('crypto')

const cookieParser = require("cookie-parser")
const accountSid = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN

const client = require('twilio')(accountSid ,authToken)
const smskey = process.env.SMS_SECRET_KEY 



router.get('/signup',(req,res)=>{
    if(req.session.logedIn){
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.redirect('/home',{admin:true})
    }else{
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.render('user/signup',{"wrongpass":req.session.password,"emailexist":req.session.signupErr,admin:true})
        req.session.signupErr=false
        req.session.password=false
    }
   
})


router.post("/register",  (req, res) => {
    // console.log(req.body.email);
    if(req.body.password === req.body.repeatpassword){
    producthelper.doSignup(req.body).then((response)=>{
        // console.log(response);
        res.redirect('/user/login')
    
        
      }).catch((err)=>{
        req.session.signupErr=err
        res.redirect('/user/signup')
      })
    }else{
        req.session.password=true
        res.redirect('/user/signup')
    }
    
    })
   

router.get('/login',(req,res)=>{
    try{
    if (req.session.logedIn) {
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.redirect('/home')
    }else{
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.render('user/login',{"loginerr":req.session.loginErr,admin:true})
        req.session.loginErr=false;
        
    }
}catch{
    
}
        
})

router.post('/login',async(req,res)=>{
    producthelper.doLogin(req.body).then((response)=>{
          response.status
          req.session.logedIn=true
          req.session.user=response.user
          res.redirect('/home')
        
          
        
      }).catch((err)=>{
        console.log(err)
        req.session.loginErr = err
        res.redirect('/user/login')
      })
})


router.get('/otplogin',(req,res)=>{
    if(req.session.logedIn){
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.render('/home',{admin:true});
    }else{
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        var err= req.query.valid
        res.render('user/otplogin',{err,admin:true})
        err=false
    }
   
})
router.post('/otplogin',(req,res)=>{
    
     const phone = `+91${req.body.phone}`
     console.log(phone);
     const otp = Math.floor(100000 + Math.random()*90000)
     const ttl = 2*60*1000
     const expires = Date.now() +ttl
     const data = `${phone}.${otp}.${expires}`
     const hash = crypto.createHmac('sha256',smskey).update(data).digest('hex')
     const fullhash = `${hash}.${expires}`

     client.messages.create({
        body :`Your one time login password for login to LJ GAMING is ${otp}`,
        from: +19787050555,
        to: phone
     }).then((messages)=> {
         console.log(messages)
        }).catch((err)=> { 
            console.error(err)
            err='someting went wrong try again'
            res.redirect('/user/otplogin/?valid'+err)
        })
        

    res.render('user/otpverification',{phone, hash: fullhash,admin:true})
})

router.post('/otpverification',(req,res)=>{
     const phone = req.body.phone;
     const hash = req.body.hash;
     const otp = req.body.otp;
     let [ hashValue, expires ] = hash.split('.')

     let now = Date.now();
     if(now>parseInt(expires)){
        return ()=>{
			var err='Timeout. Please try again'
			res.redirect('/user/otplogin/?valid'+err)

       }
    }
    let data = `${phone}.${otp}.${expires}`;
	let newCalculatedHash = crypto.createHmac('sha256', smskey).update(data).digest('hex');
	if (newCalculatedHash === hashValue) {
		console.log('user confirmed');
        req.session.logedIn=true
        res.redirect('/home') 
	} else {
		console.log('not authenticated');
		var err='Incorrect OTP' 
		return res.redirect('/user/otplogin/?valid'+err)
	}
});
















router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.redirect('/')
})
















module.exports = router;