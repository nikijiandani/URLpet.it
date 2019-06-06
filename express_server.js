const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');


app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

//set viewing engine
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

function checkIfPropertyValueExists (obj, prop, value) {
  let myKeys = Object.keys(obj);
  for(let i = 0; i < myKeys.length; i++){
    if(obj[myKeys[i]][prop] === value){
      return true;
    }
  }
  return false;
}

app.get("/", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
  }
  res.render("urls_root", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
  }
  res.render("urls_register", templateVars);
})

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
  }
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"]
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] ,
    username: req.cookies["username"]
  }
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  let shortURL = `${req.params.id}`
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// register POST route
app.post("/register", (req, res) => {
  let userId = generateRandomString();
  if(req.body.email === "" || req.body.password === ""){
    res.status(400);
    res.render("urls_register", 
    { 
      username: req.cookies["username"],
      error1: "Email or Password is an empty string"
    })
  } else {
      if(checkIfPropertyValueExists(users, "email", req.body.email)){
        res.status(400);
        res.render("urls_register",
        { 
          username: req.cookies["username"], 
          error2: "This email is already in use" 
        })
      } else {
          users[userId] = {
            id: userId,
            email: req.body.email,
            password: req.body.password
          }
          res.cookie("user_id", userId);
          console.log(users);
          res.redirect('/urls');
      }
    }
  })

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  console.log("Cookie created sucessfully");
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});