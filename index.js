const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const multer = require("multer");

// create instance
const app = express();

//initialize cors
app.use(cors())

//connect db
dotenv.config({ path: "./.env" });
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE,
});


app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);




//ROUTES

app.post("/register", async (req, res) => {
  const { username, password, firstName, lastName, email } = req.body;
  const hashPassword = await bcrypt.hash(password, 8);

  db.query(
    "Select * from register Where email=? ", email, (err,result) => {
        if(err) {
            return console.log(err.message)
        }

        if(result.length > 0) {
            return res.status(200).json({issue:"email",message:"e-mail is already in use"})
        }

        db.query(
          "Select * from register Where username=? ", username, (err,result) => {
              if(err) {
                  return console.log(err.message)
              }
      
              if(result.length > 0) {
                  return res.status(200).json({issue:"username",message:"username is already in use"})
              }

              db.query(
                "insert into register (firstName,lastName,username,email,password) values (?,?,?,?,?)",
                [firstName, lastName, username, email, hashPassword],
                (err, result) => {
                  console.log(err);
                  return res
                    .status(200)
                    .json({ message: "profile created", result: result });
                }
              );

          }
        )
    }
)
  


});

app.use("/public", express.static(
  path.join(__dirname,"/public")
))

// all multer related
const storage = multer.diskStorage({
  destination:  (req,file,callback)=> {
      callback(null,path.join(__dirname,"./public/images"))
  },
  filename:(req,file,callback)=> {
      callback(null,file.fieldname+"-"+Date.now()+path.extname(file.originalname))
  }
})

const upload = multer({storage:storage})
const imageupload = upload.fields([{name:"image"}])


app.post("/registeraddtl",imageupload,(req, res) => {

  const {username, city, birthday} = req.body
  const image = req.files.image[0]
  const imagepath = req.protocol+"://"+req.get("host")+"/public/images/"+image.filename
  console.log(imagepath)


  db.query(
    "update register set city = ? , birthday = ?, picpath=? where username = ?",
    [city, birthday,imagepath, username],
    (err, result) => {
      if (err) {
        return console.log(err.message);
      }  
    })


    db.query(
      "select * from register where username=?",
      [username],
      (err, result) => {
        if (err) {
          return console.log(err.message);
        }
  
        return res
          .status(200)
          .json({ message: "register result", result: result  })
      
      })
  

     
    }
  )


app.post("/search", (req, res) => {
  const { search } = req.body;

  db.query(
    "select * from register where firstName = ? or lastName=?",
    [search, search],
    (err, result) => {
      if (err) {
        return console.log(err.message);
      }

      return res
        .status(200)
        .json({ message: "search results", result: result  });
    }
  );
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "pls check login" });
    }

    db.query(
      "Select * from register where username=? ",
      username,
      async (err, result) => {
        if (
          !result.length ||
          !(await bcrypt.compare(password, result[0].password))
        ) {
          console.log(result);
          return res.status(401).json({ message: "invalid" });
        }

        db.query(
          "select * from register where username=?",
          username,
          (err, result) => {
            if (err) {
              console.log(err.message);
            }

            return res.status(200).json({ message: "success", array: result });
          }
        );
      }
    );
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/profile", (req, res) => {
  try {
    const { userid } = req.body;

    db.query("select * from register where userid=?", userid, (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "successfully loaded", array: result });
    });
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/newpost", (req, res) => {
  const { userid, post } = req.body;

  db.query(
    "insert into posts (userid,wallid,content) values (?,?,?)",
    [userid, userid, post],
    (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "successfully posted", array: result });
    }
  );
});

app.post("/newpostother", (req, res) => {
  const { userid, wallid, post } = req.body;
  db.query(
    "insert into posts (userid,wallid,content) values (?,?,?)",
    [userid, wallid, post],
    (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "successfully posted", array: result });
    }
  );
});

app.post("/newpostothernotif", (req, res) => {
  const { userid, wallid, postid, notiftype } = req.body;
  db.query(
    "insert into notifications (notiftype,othertypeid,notifreceiverid,notifsenderid,new_comment) values (?,?,?,?,?)",
    [notiftype, postid, wallid, userid, "1"],
    (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "successfully added", array: result });
    }
  );
});


app.post("/newcommentnotif", (req, res) => {
    const { userid, commentid, notiftype,postid } = req.body;
    db.query(
      "insert into notifications (notiftype,othertypeid,notifreceiverid,notifsenderid,new_comment) values (?,?,?,?,?)",
      [notiftype, postid, commentid, userid, "1"],
      (err, result) => {
        if (err) {
          console.log(err.message);
        }
  
        console.log(result);
        return res.status(200).json({ message: "successfully added  notif", array: result });
      }
    );
  });


  app.post("/newlikenotif", (req, res) => {
    const { userid,postid } = req.body;
    db.query(
      "insert into notifications (notiftype,othertypeid,notifreceiverid,notifsenderid,new_comment) values (?,?,?,?,?)",
      ["like", postid, postid, userid, "1"],
      (err, result) => {
        if (err) {
          console.log(err.message);
        }
  
        console.log(result);
        return res.status(200).json({ message: "successfully added  notif", array: result });
      }
    );
  });

  app.post("/deletelikenotif", (req, res) => {
    const { postid,userid } = req.body;
    db.query(`DELETE FROM notifications WHERE othertypeid =? and notifsenderid=? and notiftype=?`, [postid,userid,"like"], (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully deleted" });
    });
  });

app.post("/postfeed", (req, res) => {
  const { userid } = req.body;
  db.query(
    `select posts.postid, posts.userid, posts.wallid, posts.content, posts.date_created, 
    posts.date_updated, register.firstName, register.lastName, register.username, register.picpath,
    registerWall.firstName as wallOwnerFirstName, registerWall.lastName as wallOwnerLastName  
    from posts inner join register on posts.userid = register.userid 
    inner join register registerWall on posts.wallid = registerWall.userid
    where posts.wallid=?
    order by posts.postid desc`,
    [userid],
    (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "posts successfully loaded", array: result });
    }
  );
});

app.post("/homepagefeed", (req, res) => {
  const { userid } = req.body;

  db.query(`select * from friends_list where userid=? or friendid=?`,[userid,userid], (err,result)=> {
    if(err) {
        return console.log(err.message)
    }

    if(result.length === 0) {

        db.query(`select  posts.postid, posts.userid, posts.wallid, posts.content, posts.date_created, 
        posts.date_updated, register.firstName, register.lastName, register.username, register.picpath,
        registerWall.firstName as wallOwnerFirstName, registerWall.lastName as wallOwnerLastName   from posts
    inner join register on posts.userid = register.userid 
    inner join register registerWall on posts.wallid = registerWall.userid
     where posts.userid=?
     order by posts.postid desc`,userid,(err,result)=> {
      if (err) {
        console.log(err.message);
      }

      return res.status(200).json({issue:"no friends",array:result})
     })
        
    }

    else {

      db.query(
        ` select posts.postid, friendslist_feed.friendlistid, friendslist_feed.friendid, 
        posts.userid, posts.wallid, posts.content, posts.date_created, 
           posts.date_updated, register.firstName, register.lastName, register.username, register.picpath,
           registerWall.firstName as wallOwnerFirstName, registerWall.lastName as wallOwnerLastName   
       from friendslist_feed
       inner join posts on friendslist_feed.friendid = posts.userid
       inner join register on posts.userid = register.userid 
       inner join register registerWall on posts.wallid = registerWall.userid
        where friendslist_feed.userid=?
        order by posts.postid desc`,
        [userid],
        (err, result) => {
          if (err) {
            console.log(err.message);
          }
    
          console.log(result);
          return res.status(200).json({ message: "posts successfully loaded", array: result });
        }
      );
    }

  })

 

});

app.post("/notiffeed", (req, res) => {
  db.query(
    `select notif.notifid, notif.notiftype, notif.notifreceiverid, notif.notifsenderid, 
    sendername.firstName as senderFN, sendername.lastName as senderLN, sendername.picpath as sendernamepicpath, 
    notif.new_comment, notif.date_created,
    posts.postid, posts.userid, posts.wallid,postowner.firstName as whopostedFN, postowner.lastName as whopostedLN,
    wallowner.firstName as whosewallFN, wallowner.lastName as whosewallLN,postowner.picpath as ownerpicpath, wallowner.picpath as wallownerpicpath
        from notifications as notif
        inner join posts on notif.othertypeid = posts.postid
        inner join register as postowner on posts.userid = postowner.userid
        inner join register as wallowner on posts.wallid = wallowner.userid
        inner join register as sendername on notif.notifsenderid = sendername.userid
        order by notif.date_created desc`,
    (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "success", array: result });
    }
  );
});

app.post("/friendrequest", (req, res) => {
  const { userid, otherid } = req.body;
  db.query(
    "insert into friend_requests (userid,requestorid) values (?,?)",
    [otherid, userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully added" });
    }
  );
});

app.post("/friendrequestpage", (req, res) => {
  const { userid } = req.body
  db.query(
    `select friend_requests.requestid, friend_requests.userid as requestee, friend_requests.requestorid, 
    friend_requests.date_created, register.userid, register.picpath,
    register.firstName, register.lastName,register.city from friend_requests 
        inner join register on friend_requests.requestorid=register.userid 
        where friend_requests.userid = ?`,
    [userid],
    (err, result) => {
      console.log(err)
      return res.status(200).json({ message: "success", array: result })
    }
  )
})

app.post("/frsearcher", (req, res) => {
  const { userid, wallid } = req.body
  db.query(
    `select * from friend_requests where userid=? and requestorid=?`,
    [wallid, userid],
    (err, result) => {
      console.log(err)
      return res.status(200).json({ message: "success", array: result })
    }
  )
})

app.post("/flsearcher", (req, res) => {
  const { userid, wallid } = req.body;
  db.query(
    `select * from  friends_list where userid=? and friendid=?`,
    [userid,wallid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "success", array: result })
    }
  )
})

app.post("/deletepost", (req, res) => {
  const { postid } = req.body;
  db.query(`DELETE FROM posts WHERE postid =?`, [postid], (err, result) => {
    console.log(err);
    return res.status(200).json({ message: "successfully deleted post",array: result  });
  });

  db.query(`DELETE FROM post_likes WHERE postid =?`, [postid], (err, result) => {
    console.log(err);
    return res.status(200).json({ message: "successfully deleted likes of this post",array: result  });
  });

  db.query(`DELETE FROM comments WHERE postid =?`, [postid], (err, result) => {
    console.log(err);
    return res.status(200).json({ message: "successfully deleted comments of this post",array: result  });
  });

  db.query(`DELETE FROM notifications WHERE othertypeid =?`, [postid], (err, result) => {
    console.log(err);
    return res.status(200).json({ message: "successfully deleted notifications of this post",array: result  });
  });
});

app.post("/deleterequest", (req, res) => {
  const { requestid } = req.body;
  db.query(`DELETE FROM friend_requests WHERE requestid =?`, [requestid], (err, result) => {
    console.log(err);
    return res.status(200).json({ message: "successfully deleted friend request", array: result});
  });
});

app.post("/editprofile",imageupload ,(req, res) => {
  const {
    firstName,
    lastName,
    nickname,
    intro,
    status,
    birthday,
    city,
    userid
  } = req.body;

  const image = req.files.image[0]
  const imagepath = req.protocol+"://"+req.get("host")+"/public/images/"+image.filename
  console.log(imagepath)

  db.query(
    `update register set firstName=?,lastName=?,nickname=?,intro=?,status=?,birthday=?,city=?,picpath=? where userid=?`,
    [firstName, lastName, nickname, intro, status, birthday, city,imagepath, userid],
    (err, result) => {
      console.log(err);
      return res
        .status(200)
        .json({ message: "successfully edited", array: result });
    }
  );
});

app.post("/editemail" ,(req, res) => {
  const {
    email,
    userid
  } = req.body;


  db.query(
    `update register set email=? where userid=?`,
    [email, userid],
    (err, result) => {
      console.log(err);
      return res
        .status(200)
        .json({ message: "successfully edited", array: result });
    }
  );
});

app.post("/notifreset" ,(req, res) => {
  const { userid } = req.body;


  db.query(
    `update notifications
    inner join posts on notifications.othertypeid = posts.postid
    inner join register on posts.userid = register.userid
    set new_comment = ?
    where (notifications.notiftype = 'like' or notifications.notiftype='comment')
    and posts.wallid=?`,
    ["0",userid],
    (err, result) => {
      console.log(err);
      return res
        .status(200)
        .json({ message: "successfully edited", array: result });
    }
  );
});

app.post("/editusername" ,(req, res) => {
  const {
    username,
    userid
  } = req.body;


  db.query(
    `update register set username=? where userid=?`,
    [username, userid],
    (err, result) => {
      console.log(err);
      return res
        .status(200)
        .json({ message: "successfully edited", array: result });
    }
  );
});

app.post("/editpassword" , async(req, res) => {
  const {
    password,
    userid
  } = req.body;

  const hashPassword = await bcrypt.hash(password, 8);

  db.query(
    `update register set password=? where userid=?`,
    [hashPassword, userid],
    (err, result) => {
      console.log(err);
      return res
        .status(200)
        .json({ message: "successfully edited", array: result });
    }
  );
});

app.post("/editpost", (req, res) => {
  const { content, postid } = req.body;
  db.query(
    `update posts set content=? where postid=?`,
    [content, postid],
    (err, result) => {
      console.log(err);
      return res
        .status(200)
        .json({ message: "successfully edited", array: result });
    }
  );
});

app.post("/addcomment", (req, res) => {
  const { content, postid, userid } = req.body;
  db.query(
    `insert into comments (postid,content,userid) values (?,?,?)`,
    [postid, content, userid],
    (err, result) => {
      console.log(err);
      return res
        .status(200)
        .json({ message: "successfully added comment", array: result });
    }
  );
});

app.post("/addfriend", (req, res) => {
  const { friendid, userid } = req.body;
  db.query(
    `insert into friends_list (friendid,userid) values (?,?)`,
    [friendid, userid],
    (err, result) => {
      if(err) {
        return console.log(err.message)
      }

      res.status(200).json({ message: "successfully added comment", array: result })

      db.query(
        `insert into friends_list (friendid,userid) values (?,?)`,
        [userid, friendid],
        (err, result) => {
          if(err) {
            return console.log(err.message)
          }

         res.status(200).json({ message: "successfully added comment", array: result })

         db.query(
          `delete from friend_requests where requestorid=? and userid=?`,
          [friendid, userid],
          (err, result) => {
            if(err) {
              return console.log(err.message)
            }

            res.status(200).json({ message: "successfully added comment", array: result })
          }
        )
        })
        }
      );
    }
  )
  
 

app.post("/addfriendfeed", (req, res) => {
  const { friendid, userid } = req.body;

  db.query(
    `insert into friendslist_feed (friendid,userid) values (?,?)`,
    [friendid, userid],
    (err, result) => {
      if(err) {
        return console.log(err.message)
      }

     res.status(200).json({ message: "successfully added comment", array: result })

     db.query(
      `insert into friendslist_feed (friendid,userid) values (?,?)`,
      [userid, friendid],
      (err, result) => {
      if(err) {
          return console.log(err.message)
       }
  
        return res
          .status(200)
          .json({ message: "successfully added comment", array: result });
      }
    )
    }
  )
  
})



app.post("/addfriendnotif", (req, res) => {
  const { friendid, userid } = req.body;
  db.query(
    "insert into notifications (notiftype,othertypeid,notifreceiverid,notifsenderid,new_comment) values (?,?,?,?,?)",
    ["friends", userid, friendid, userid, "1"],
    (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "successfully added friend notif", array: result });
    }
  );
})

app.post("/addselffeed", (req, res) => {
  const { userid } = req.body;

  db.query(
    `insert into friendslist_feed (friendid,userid) values (?,?)`,
    [userid, userid],
    (err, result) => {
      
        if (err) {
          return console.log(err.message)
        }

       res.status(200).json({ message: "successfully added comment", array: result });
    }
  ) 
})

app.post("/deletefriend", (req, res) => {
  const { friendid, userid } = req.body
  db.query(`DELETE FROM friends_list WHERE friendid =? and userid=?`, [friendid, userid], (err, result) => {
            if (err) {
          return console.log(err.message)
        }

     res.status(200).json({ message: "successfully deleted friend request", array: result})
  })

  db.query(`DELETE FROM friends_list WHERE friendid =? and userid=?`, [userid,friendid], (err, result) => {
            if (err) {
          return console.log(err.message)
        }

     res.status(200).json({ message: "successfully deleted friend request", array: result})
  })

  db.query(`DELETE FROM friendslist_feed WHERE friendid =? and userid=?`, [friendid, userid], (err, result) => {
            if (err) {
          return console.log(err.message)
        }

     res.status(200).json({ message: "successfully deleted friend request", array: result})
  })

  db.query(`DELETE FROM friendslist_feed WHERE friendid =? and userid=?`, [userid,friendid], (err, result) => {
            if (err) {
          return console.log(err.message)
        }

     res.status(200).json({ message: "successfully deleted friend request", array: result})
  })

  db.query(`DELETE FROM friendslist_feed WHERE friendid =? and userid=?`, [userid,userid], (err, result) => {
            if (err) {
          return console.log(err.message)
        }

    return res.status(200).json({ message: "successfully deleted friend request", array: result})
  })
})


app.post("/commentfeed", (req, res) => {
  const { postid } = req.body
  db.query(
    `select comments.commentid, comments.postid,comments.content,comments.date_created,
    register.firstName,register.lastName,register.picpath, register.userid as id from comments
    inner join register on comments.userid = register.userid where comments.postid=? order by comments.postid desc`,
    [postid],
    (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "comments successfully loaded", array: result });
    }
  );
});

app.post("/deletecomment", (req, res) => {
  const { commentid } = req.body;
  db.query(
    `DELETE FROM comments WHERE commentid =?`,
    [commentid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully deleted comment" });
    }
  );
});

app.post("/editcomment", (req, res) => {
  const { content, commentid } = req.body;
  db.query(
    `update comments set content=? where commentid=?`,
    [content, commentid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully edited comment" });
    }
  );
});

app.post("/addlike", (req, res) => {
  const { userid, postid } = req.body;
  db.query(
    "insert into post_likes (postid,userid) values (?,?)",
    [postid, userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully added likes",response:result });
    }
  );
});

app.post("/deletelike", (req, res) => {
  const { postid,userid } = req.body;
  db.query(`DELETE FROM post_likes WHERE postid =? and userid=?`, [postid,userid], (err, result) => {
    console.log(err);
    return res.status(200).json({ message: "successfully deleted" });
  });
});

app.post("/likesearcher", (req, res) => {
  const { postid,userid } = req.body;
  db.query(`select * FROM post_likes WHERE postid =? and userid=?`, [postid,userid], (err, result) => {
    console.log(err)
    return res.status(200).json({ message: "successfully searched for likes",array:result })
  })
})

app.post("/likefeed", (req, res) => {
  const {postid} = req.body;
  db.query(
    `select likes.likeid, likes.postid, likes.userid as userid,
    username.firstName, username.lastName
    from post_likes as likes
    inner join register as username 
    on likes.userid = username.userid
    where likes.postid = ?`,
    [postid],
    (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "likes successfully loaded", array: result });
    }
  );
});

app.post("/flfeed", (req, res) => {
  try {
    const { userid } = req.body;

    db.query(`
    select friends_list.friendlistid, friends_list.userid, friends_list.friendid, register.firstName, register.lastName,
    register.nickname, register.city, register.picpath, register.birthday
    from friends_list 
    inner join register on friends_list.friendid = register.userid
    where friends_list.userid=?`, [userid], (err, result) => {
      if (err) {
        console.log(err.message);
      }

      console.log(result);
      return res.status(200).json({ message: "successfully loaded friends", array: result });
    });
  } catch (error) {
    console.log(error.message);
  }
});


app.post("/deleteaccount", (req, res) => {
  const { userid } = req.body;
  db.query(
    `DELETE FROM register WHERE userid =?`,
    [userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully deleted account", result:result});
    }
  );

  db.query(
    `DELETE FROM comments WHERE userid =?`,
    [userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully deleted comments", result:result});
    }
  );

  db.query(
    `DELETE FROM friend_requests WHERE userid =?`,
    [userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully deleted comments", result:result});
    }
  );

  db.query(
    `DELETE FROM friends_list WHERE userid =? or friendid=?`,
    [userid,userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully deleted comments", result:result});
    }
  );

  db.query(
    `DELETE FROM notifications WHERE notifreceiverid =? or notifsenderid=?`,
    [userid,userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully deleted comments", result:result});
    }
  );

  db.query(
    `DELETE FROM post_likes WHERE userid=?`,
    [userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully deleted comments", result:result});
    }
  );

  db.query(
    `DELETE FROM posts WHERE userid=? or wallid=?`,
    [userid,userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "successfully deleted comments", result:result});
    }
  );

  

});

app.listen(process.env.PORT || 5001, "0.0.0.0", () => {
  console.log("server started");
  db.connect((err) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log(`db connected`);
    }
  });
});
