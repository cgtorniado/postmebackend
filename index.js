const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const path = require("path")
const multer = require("multer")

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
app.use("/public", express.static(
    path.join(__dirname,"/public")
))



//multer
const storage = multer.diskStorage({
    destination:  (req,file,callback)=> {
        callback(null,path.join(__dirname,"../public/images"))
    },
    filename:(req,file,callback)=> {
        callback(null,file.fieldname+"-"+Date.now()+path.extname(file.originalname))
    }
})

const upload = multer({storage:storage})
const imageupload = upload.fields([{name:"image"}])


//ROUTES

app.post('/register', async (req,res)=> {
    const {username,password,firstName,lastName,email} = req.body
    const hashPassword = await bcrypt.hash(password,8)
    db.query("insert into register (firstName,lastName,username,email,password) values (?,?,?,?,?)",[firstName,lastName,username,email,hashPassword] , 
    (err,result) => {   
          console.log(err)
    })
})

app.post('/registeraddtl', imageupload , (req,res)=> {
    const {userid,birthday,city} = req.body
    const image = req.files.image[0]
    const imagepath = req.protocol+"://"+req.get("host")+"/public/images/"+image.filename
    console.log(imagepath)

    db.query("update register set city=?, birthday=?, picpath=? where userid=?",[city,birthday,imagepath,userid] , 
    (err,result) => {   
          console.log(err)
    })
})



// app.post('/createpost', async (req,res)=> {
//     const {username,content}= req.body
//     db.query("insert into posts (username,post_content) values (?,?)",[username,content] , 
//     (err,result) => {   
//           console.log(err)
//     })
// } )

// app.get('/allposts', async (req,res)=> {
   
//     db.query(
//         "select * from posts order by post_id desc", (err,result) => {
//             if(err){
//                 return console.log(err.message)
//             }

//             res.send(result)
//         }
//     )
// } )

app.post('/login', async (req,res)=>  {

    try{
        const {username,password} = req.body

        if(!username || !password) {
            return res.status(400).json({message: "pls check login"})
        }

        db.query(
            "Select * from register where username=? ",username,
            async (err, result) => {
                if(!result.length || !(await bcrypt.compare(password,result[0].password)) ) {
                    console.log(result);
                    return res.status(401).json({message: "invalid"}) 
                }

                db.query(
                    "select * from register where username=?", username, (err,result) => {
                        if(err){
                        
                                console.log(err.message);
                               
                        }

                        return res.status(200).json({message: "success", array:result})
                    }
                )
            }
        )
    }

    catch (error){
        console.log(error.message)
    }

}
)

app.post('/profile', (req,res)=>  {

    try{
        const {userid} = req.body

        db.query("select * from register where userid=?", userid, (err,result) => {
                        if(err){
                            console.log(err.message);
                        }

                        console.log(result)
                        return res.status(200).json({message: "success", array:result})
                    }
                )
            }
    
    

    catch (error){
        console.log(error.message)
    }

}
)



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
