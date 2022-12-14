const express = require("express")
const dotenv = require("dotenv")
const createError = require('http-errors')
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
    if(err) console.log('database error',err)
    else console.log('dataBase Is Connected');
  })
  
app.use(cookieParser())
app.use('/admin' ,adminRouter)
app.use('/users',userRoute)
app.use('/user',authRoute)
app.use('/', landRouter)

app.get('/error',(req,res)=>{
  if (req.session.loggedIn) {
    res.render('error',{admin:true});
  }
  else{
    res.render('error');
  }
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err.message);
  // render the error page
  res.status(err.status || 500);
  res.redirect('/error')
  
});




app.listen(process.env.PORT || 5000,()=>{
    console.log("server is running.......")
})  