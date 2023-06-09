const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");
const localStrategy = require('passport-local').Strategy
const mysql = require('mysql')
const flash = require('connect-flash')
const { v4: uuidv4 } = require('uuid');
const { stringify } = require("querystring");

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "SLMy23$spin"
  });
  
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });
con.on('error', function(err) {
    console.log("[mysql error]",err);
  });

const app = express();
app.use(flash())
app.listen(5000, (req, res)=>{
  console.log("Server running")
})

app.use(cors({
    origin : 'http://localhost:3000',
    credentials: true
}))

app.use(bodyParser.json())
app.use(session(
    {
        secret: 'secret',
        resave: true,
        saveUninitialized:  true
    }
))

app.use(cookieParser('secret'))

app.use(passport.initialize())
app.use(passport.session())

passport.use(
    new localStrategy((username, password, done)=>{
        q = `SELECT * FROM ewm_clients.registered WHERE username = '${username}'`
            con.query(q, (err,user)=>{
                console.log(user)
                if (!user) return done(null, false)
                else{
                    bcrypt.compare(password, user[0].password, (err, result)=>{
                        console.log(result)
                        if(result) return done(null, user[0])
                        else{
                            return done(null, false)
                        }
                    })
    }
})
   
})
)

passport.serializeUser(function(user, done){
    done(null, user)
})

passport.deserializeUser(function(user, done){
    done(null, user)
})

app.use((req,res, next)=>{
    res.locals.flash = null
    next();
})
app.post('/login', (req,res,next)=>{
    console.log(req.body)
    passport.authenticate('local', (err, user)=>{
        console.log(user)
        if (user == false){
            req.flash('error', 'User not found')
             res.send({
            status: 404,
            message: 'User not found',
            flash: req.flash('error')
        })
    }
        else{
            req.logIn(user, (err)=>{
                if (err) throw err
            req.flash('success', 'Login Successful')
            res.send({
                result: req.user,
                flash: req.flash('success')
            })
            })
            

        }
    })(req, res, next);
})
app.get('/user',(req, res)=>{
    
    res.send(req.user)

})

app.post('/register', (req, res)=>{
    con.query(`SELECT * FROM ewm_clients.registered WHERE username = '${req.body.username}'`, async(err, data)=>{
        if(data.length >=1){
            req.flash('error', 'User already exists')
            res.send({
                message: 'User already exists',
                status: false,
                flash: req.flash('error')
            })
        } 
        if(data.length == 0){
            const hashedPassword = bcrypt.hashSync(req.body.password, 10, (err)=>{if (err) throw err})
            const newUser ={
                user_id: uuidv4(),
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword
            }
            con.query(`INSERT INTO ewm_clients.registered (user_id, username, email_id, password) VALUES ('${newUser.user_id}','${newUser.username}','${newUser.email}','${newUser.password}')`, (err)=>{if (err) throw err})
            req.flash('success', 'User created successfully')
            res.send({
                result: newUser,
                status: true,
            flash: req.flash('success')})
        }
    })

})

app.post('/logout', (req,res)=>{
  if(req.isAuthenticated()){
    req.logOut((err)=>{if (err) throw err})
    req.flash('success', 'You have successfully logged out')
    res.send({
        message: 'Logged out',
    flash: req.flash('success')})
  }
  else{
    res.send("Already logged out")
  }
})

