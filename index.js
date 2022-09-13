const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const path = require('path')
const hbs = require('express-handlebars')
const app = express()
var session = require('express-session')
const cookieParser = require('cookie-parser') 
const db = require('./config/connection')

const Swal = require('sweetalert2')

app.set('view engine','hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))
app.use(express.urlencoded({extended:false}))
const userRoute = require("./routes/user")
const authRoute = require("./routes/auth")
const landRouter = require("./routes/landingpage")
const adminRouter = require("./routes/adminauth")
const { handlebars, create } = require("express-hbs")

dotenv.config()


app.use(express.json())
app.use(express.static(path.join(__dirname,'public')))


var method = hbs.create({})

method.handlebars.registerHelper('ifCond',function(v1,v2,options){
  if(v1 === v2){
    return options.fn(this);
  }
     return options.inverse(this);
});

app.use(session({
    secret:"key",
    resave:false,
    saveUninitialized:true,
  }))
  db.connect((err)=>{
    if(err) console.log('database error')
    else console.log('dataBase Is Connected');
  })
  
app.use(cookieParser())
app.use('/admin' ,adminRouter)
app.use('/users',userRoute)
app.use('/user',authRoute)
app.use('/', landRouter)



app.listen(process.env.PORT || 5000,()=>{
    console.log("server is running.......")
})