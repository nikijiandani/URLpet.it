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

function findUserByEmail (email) {
  for(key in users) {
    if(users[key]["email"] === email){
      return users[key];
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
    user: users[req.cookies["user_id"]]
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
  if(!req.body.email || !req.body.password){
    return res.status(400).render("urls_register", { error: "Email or password is invalid" });
  }
  
  if(findUserByEmail(req.body.email)){
    return res.status(400).render("urls_register", { error: "This email is already in use" })
  }
  
  //ADD THE USER TO THE DATABSE
  let userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: req.body.password
  }
  res.cookie("user_id", userId);
  res.redirect('/urls');
})


app.post("/login", (req, res) => {
  const user = findUserByEmail(req.body.email);
  if(!user || !req.body.password || req.body.password !== user.password){
    return res.status(403).render("urls_login", {error: "Email or password is invalid"})
  }
  if(user && user.email === req.body.email && user.password === req.body.password){
    return res.cookie("user_id", user.id).redirect('/urls'); 
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Server Started!!! TinyURL is listening on port ${PORT}!`);
});