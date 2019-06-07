const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

app.use(express.static('public'));

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

//HELPER FUNCTIONS

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

function findKeyAndValueInObject (obj, value) {
  for(key in obj) {
    for(prop in obj[key]){
      if(obj[key][prop] === value) {
        return [key, obj[key][prop]];
      }
    }
  }
  return false;
}

// ROOT ROUTE
app.get("/", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_root", templateVars);
});

//VIEW URLS IN JSON FORMAT
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//SHOW REGISTER PAGE
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
  }
  res.render("urls_register", templateVars);
})

//CREATE NEW TINYURL 
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
  }
  res.render("urls_new", templateVars);
});

//VIEW ALL URLS
app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_index", templateVars);
});

//URL SHOW & EDIT PAGE
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] ,
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_show", templateVars);
});

//URL REDIRECTOR
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//LOGIN PAGE
app.get("/login", (req, res) => {
  res.render("urls_login");
})

//********POST ROUTES********

//CREATE A NEW TINYURL 
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls');
});

//EDIT YOUR TINYURL
app.post("/urls/:id", (req, res) => {
  let shortURL = `${req.params.id}`
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls');
});

//DELETE URL
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// REGISTER A NEW USER
app.post("/register", (req, res) => {
  let userId = generateRandomString();
  if(req.body.email === "" || req.body.password === ""){
    res.status(400);
    res.render("urls_register", 
    { 
      error1: "Email or Password is an empty string"
    })
  } else {
      if(findKeyAndValueInObject(users, req.body.email) === 'false'){
        res.status(400);
        res.render("urls_register",
        { 
          error2: "This email is already in use" 
        })
      } else {
        //ADD THE USER TO THE DATABSE
          users[userId] = {
            id: userId,
            email: req.body.email,
            password: req.body.password
          }
          res.cookie("user_id", userId);
          res.redirect('/urls');
      }
    }
  })


app.post("/login", (req, res) => {
  let idAndEmail = findKeyAndValueInObject(users, req.body.email);
  let idAndPassword = findKeyAndValueInObject(users, req.body.password);
  if(!idAndEmail || !idAndPassword){
    res.status(403);
    res.render("urls_login", {error: "Your Email or Password is incorrect!"})
  } else if(idAndEmail[0] === idAndPassword[0]){
    let uId = idAndEmail[0];
    res.cookie("user_id", uId);
    res.redirect('/urls'); 
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Server Started!!! TinyURL is listening on port ${PORT}!`);
});