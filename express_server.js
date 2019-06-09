const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.use(cookieSession({
  name: 'session',
  keys: ["myx1anuts", "ghxbchjxgyzxftdyc"]
}));
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
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", 10)
  },
 "23rf45": {
    id: "23rf45", 
    email: "hello@example.com", 
    password: bcrypt.hashSync("pass", 10)
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
  if(req.session.user_id){
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

//LOGIN PAGE
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
  }
  if(req.session.user_id){
    return res.redirect("/urls");
  }
  if(req.session.error){
    templateVars.error = req.session.error;
  };
  res.render("urls_login", templateVars);
})

//SHOW REGISTER PAGE
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
  }
  res.render("urls_register", templateVars);
})

//CREATE NEW TINYURL 
app.get("/urls/new", (req, res) => {
  let cookieId = req.session.user_id;
  if(!cookieId){
    req.session.error = "You must be logged in to do that!"
    return res.redirect("/login");
  }
  if (cookieId === users[cookieId]["id"]){
    return res.render("urls_new", { user: users[cookieId] });
  } 
  req.session.error = "You encountered an error! Please try again."
  res.redirect("/login");
});

//VIEW ALL URLS
app.get("/urls", (req, res) => {
  let usersUrls = urlsForUser(req.session.user_id);
  if(req.session.user_id){
    return res.render("urls_index", { urls: usersUrls, user: users[req.session.user_id] });
  }
  res.render("urls_login", { error: "You must be logged in to do that!" });
});

//URL SHOW & EDIT PAGE
app.get("/urls/:shortURL", (req, res) => {
  if(!req.session.user_id || req.session.user_id !== users[req.session.user_id]["id"]){
    return res.redirect("/login");
  }
  if(!urlDatabase[req.params.shortURL] || req.session.user_id !== urlDatabase[req.params.shortURL]["userID"]){
    return res.send("<html><h1>You do not have access to this page! Please try again.</h1></html>")
  }
  if(req.session.user_id === users[req.session.user_id]["id"] && req.session.user_id === urlDatabase[req.params.shortURL]["userID"]){
    let usersUrls = urlsForUser(req.session.user_id);
    let templateVars = { 
      shortURL: req.params.shortURL, 
      longURL: usersUrls[req.params.shortURL]["longURL"],
      user: users[req.session.user_id]
    }
    return res.render("urls_show", templateVars);
  }
  res.redirect("/urls");
});

//URL REDIRECTOR
app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL] || !urlDatabase[req.params.shortURL]["longURL"]){
    return res.send("<html><h1>This shortURL doesn't exist! Please try again.</h1></html>")
  }
  if(urlDatabase[req.params.shortURL]["longURL"]){
    const longURL = urlDatabase[req.params.shortURL]["longURL"];
    return res.redirect(longURL);
  }
  res.send("<html><h1>This shortURL doesn't exist! Please try again.</h1></html>")
});


//********POST ROUTES********

//CREATE A NEW TINYURL 
app.post("/urls", (req, res) => {
  if(req.session.user_id){
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {}
    urlDatabase[shortURL]["longURL"] = req.body.longURL;
    urlDatabase[shortURL]["userID"] = req.session.user_id;
    return res.redirect('/urls');
  }
  req.session.error = "You must be logged in to do that!";
  res.redirect("/login");
});

//EDIT YOUR TINYURL
app.post("/urls/:id", (req, res) => {
  if(!req.session.user_id){
    return res.redirect("/login");
  }
  if(req.session.user_id === users[req.session.user_id]["id"]){
    let shortURL = `${req.params.id}`
    urlDatabase[shortURL]["longURL"] = req.body.longURL;
    return res.redirect('/urls');
  }
  req.session.error = "You must be logged in to do that!";
  res.redirect("/login");
});

//DELETE URL
app.post("/urls/:shortURL/delete", (req, res) => {
  if(!req.session.user_id){
    return res.status(403).redirect("/login");
  }
  if(req.session.user_id === users[req.session.user_id]["id"]){
    delete urlDatabase[req.params.shortURL];
    return res.redirect('/urls');
  } 
  req.session.error = "You must be logged in to do that!";
  res.redirect("/login");
});

// REGISTER A NEW USER
app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password){
    return res.status(400).render("urls_register", { error: "Please enter an email and a password" });
  }
  
  if(findUserByEmail(req.body.email)){
    return res.status(400).render("urls_register", { error: "This email is already in use" })
  }
  
  //ADD THE USER TO THE DATABSE
  let userId = generateRandomString();
  let hashedPassword = bcrypt.hashSync(req.body.password, 10)
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: hashedPassword 
  }
  // res.cookie("user_id", userId);
  req.session.user_id = userId;
  res.redirect('/urls');
})

// USER LOGIN
app.post("/login", (req, res) => {
  const user = findUserByEmail(req.body.email);
  if(!user || !req.body.password || !bcrypt.compareSync(req.body.password, user.password)){
    return res.status(403).render("urls_login", {error: "Email or password is invalid"})
  }
  if(user && user.email === req.body.email && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect('/');
})

app.listen(PORT, () => {
  console.log(`Server Started!!! TinyURL is listening on port ${PORT}!`);
});