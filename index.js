const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv")
const cors = require("cors")
const bcrypt = require("bcryptjs")

// create instance
const app = express();

//initialize cors
app.use(cors())


//connect db
dotenv.config({path:"./.env"})
const db = mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    password:process.env.DATABASE_PASSWORD,
    port:process.env.DATABASE_PORT,
    database:process.env.DATABASE
})

//install pacakge env para secure ang db info

app.use(express.json());
app.use(express.urlencoded({
    extended:true    
}))

app.post('/register', async (req,res)=> {
    const username = req.body.username
    const password = req.body.password
    const hashPassword = await bcrypt.hash(password,8)
    db.query("insert into register (username,password) values (?,?)",[username,hashPassword] , 
    (err,result) => {   
          console.log(err)
    })
})


app.post('/createpost', async (req,res)=> {
    const {username,content}= req.body
    db.query("insert into posts (username,post_content) values (?,?)",[username,content] , 
    (err,result) => {   
          console.log(err)
    })
} )

app.get('/allposts', async (req,res)=> {
   
    db.query(
        "select * from posts order by post_id desc", (err,result) => {
            if(err){
                return console.log(err.message)
            }

            res.send(result)
        }
    )
} )



app.listen(process.env.PORT || 5001, '0.0.0.0', ()=> {
    console.log("server started");
    db.connect((err) => {
        if(err) {
            console.log(err.message)
        }
        else {
            console.log(`db connected`)
        }
    })
});
