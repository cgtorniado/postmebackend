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
app.use(cors());

//connect db
dotenv.config({ path: "./.env" });
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE,
});

//install pacakge env para secure ang db info

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
    "insert into register (firstName,lastName,username,email,password) values (?,?,?,?,?)",
    [firstName, lastName, username, email, hashPassword],
    (err, result) => {
      console.log(err);
      return res
        .status(200)
        .json({ message: "profile created", result: result });
    }
  );
});

app.post("/registeraddtl", (req, res) => {
  const { username, birthday, city } = req.body;

  db.query(
    "update register set city = ? , birthday = ?  where username = ?",
    [city, birthday, username],
    (err, result) => {
      if (err) {
        return console.log(err.message);
      }

      db.query(
        "select * from register where username = ?",
        [username],
        (err, result) => {
          if (err) {
            return console.log(err.message);
          }

          return res
            .status(200)
            .json({ message: "profile updated", result: result });
        }
      );
    }
  );
});

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

app.post("/postfeed", (req, res) => {
  const { userid } = req.body;
  db.query(
    `select posts.postid, posts.userid, posts.wallid, posts.content, posts.date_created, 
    posts.date_updated, register.firstName, register.lastName, register.username,
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

app.post("/notiffeed", (req, res) => {
  db.query(
    `select notif.notifid, notif.notiftype, notif.new_comment, notif.date_created,
    posts.postid, posts.userid, posts.wallid, postowner.firstName as whopostedFN, postowner.lastName as whopostedLN,
    wallowner.firstName as whosewallFN, wallowner.lastName as whosewallLN
        from notifications as notif
        inner join posts on notif.othertypeid = posts.postid
        inner join register as postowner on posts.userid = postowner.userid
        inner join register as wallowner on posts.wallid = wallowner.userid
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
  const { userid } = req.body;
  db.query(
    `select friend_requests.requestid, friend_requests.userid as requestee, friend_requests.requestorid, 
    friend_requests.date_created, register.userid,
    register.firstName, register.lastName,register.city from friend_requests 
        inner join register on friend_requests.requestorid=register.userid 
        where friend_requests.userid = ?`,
    [userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "success", array: result });
    }
  );
});

app.post("/frsearcher", (req, res) => {
  const { userid, wallid } = req.body;
  db.query(
    `select * from friend_requests where userid=? and requestorid=?`,
    [wallid, userid],
    (err, result) => {
      console.log(err);
      return res.status(200).json({ message: "success", array: result });
    }
  );
});

app.post("/deletepost", (req, res) => {
  const { postid } = req.body;
  db.query(`DELETE FROM posts WHERE postid =?`, [postid], (err, result) => {
    console.log(err);
    return res.status(200).json({ message: "successfully deleted post",  });
  });
});

app.post("/deletepost", (req, res) => {
  const { requestid } = req.body;
  db.query(`DELETE FROM friend_requests WHERE requestid =?`, [requestid], (err, result) => {
    console.log(err);
    return res.status(200).json({ message: "successfully deleted friend request", array: result});
  });
});

app.post("/editprofile", (req, res) => {
  const {
    firstName,
    lastName,
    nickname,
    intro,
    status,
    birthday,
    city,
    userid,
  } = req.body;
  db.query(
    `update register set firstName=?,lastName=?,nickname=?,intro=?,status=?,birthday=?,city=? where userid=?`,
    [firstName, lastName, nickname, intro, status, birthday, city, userid],
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

app.post("/commentfeed", (req, res) => {
  const { postid } = req.body;
  db.query(
    `select comments.commentid, comments.postid,comments.content,comments.date_created,
    register.firstName,register.lastName, register.userid as id from comments
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
    console.log(err);
    return res.status(200).json({ message: "successfully searched for likes",array:result });
  });
});

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
