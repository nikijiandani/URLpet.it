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
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" },
  "b6UTxQ": { longURL: "http://www.cnn.com", userID: "user2RandomID" }
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

function urlsForUser(id) {
  let result = {}
  for(key in urlDatabase){
    if(urlDatabase[key]["userID"] === id){
      result[key] = urlDatabase[key];
    }
  }
  return result;
}

// ROOT ROUTE
app.get("/", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_root", templateVars);
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
  let cookieId = req.cookies["user_id"];
  console.log(cookieId);
  console.log(users[cookieId]);
  if(!cookieId){
    return res.cookie("error", "You must be logged in to do that!", { maxAge: 20000 }).redirect("/login");
  } else if (cookieId === users[cookieId]["id"]){
    return res.render("urls_new", { user: users[cookieId] });
  } 
  return res.cookie("error", "You encountered an error! Please try again.", { maxAge: 20000 }).redirect("/login");
});

//VIEW ALL URLS
app.get("/urls", (req, res) => {
  let usersUrls = urlsForUser(req.cookies["user_id"]);
  if(req.cookies["user_id"]){
    return res.render("urls_index", { urls: usersUrls, user: users[req.cookies["user_id"]] });
  }
  return res.render("urls_login", { error: "You must be logged in to do that!" });
});

//URL SHOW & EDIT PAGE
app.get("/urls/:shortURL", (req, res) => {
  if(req.cookies["user_id"] === users[req.cookies["user_id"]]["id"]){
    let usersUrls = urlsForUser(req.cookies["user_id"]);
    let templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: usersUrls[req.params.shortURL]["longURL"],
      user: users[req.cookies["user_id"]]
    }
    return res.render("urls_show", templateVars);
  }
  return res.render("urls_login", { error: "You must be logged in to do that!" });
});

//URL REDIRECTOR
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});

//LOGIN PAGE
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
  }
  if(req.cookies.error){
    templateVars.error = req.cookies.error;
    res.clearCookie("error");
  };
  return res.render("urls_login", templateVars);
})

//********POST ROUTES********

//CREATE A NEW TINYURL 
app.post("/urls", (req, res) => {
  if(req.cookies.user_id){
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {}
    urlDatabase[shortURL]["longURL"] = req.body.longURL;
    urlDatabase[shortURL]["userID"] = req.cookies["user_id"];
    return res.redirect('/urls');
  }
  return res.cookie("error", "You must be logged in to do that!", { maxAge: 900000 }).redirect("/login");
});

//EDIT YOUR TINYURL
app.post("/urls/:id", (req, res) => {
  if(req.cookies.user_id === users[req.cookies["user_id"]]["id"]){
    let shortURL = `${req.params.id}`
    urlDatabase[shortURL]["longURL"] = req.body.longURL;
    return res.redirect('/urls');
  }
  return res.cookie("error", "You must be logged in to do that!", { maxAge: 900000 }).redirect("/login");
});

//DELETE URL
app.post("/urls/:shortURL/delete", (req, res) => {
 if(!req.cookies.user_id){
   return res.status(403).redirect("/login");
 }
  if(req.cookies.user_id === users[req.cookies["user_id"]]["id"]){
    delete urlDatabase[req.params.shortURL];
    return res.redirect('/urls');
  } 
  return res.cookie("error", "You must be logged in to do that!", { maxAge: 900000 }).redirect("/login");
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
  res.clearCookie("error");
  res.redirect('/');
})

app.listen(PORT, () => {
  console.log(`Server Started!!! TinyURL is listening on port ${PORT}!`);
});