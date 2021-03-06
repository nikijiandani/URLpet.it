const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ["myx1anuts", "ghxbchjxgyzxftdyc"]
}));

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));

var urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca", 
    userID: "userRandomID"
  },
  "9sm5xK": { 
    longURL: "http://www.google.com", 
    userID: "user2RandomID" 
  },
  "b6UTxQ": { 
    longURL: "http://www.cnn.com", 
    userID: "user2RandomID" 
  }
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

//generates a 6 character random string
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

//finds users in database with provided email address
function findUserByEmail (email) {
  for(key in users) {
    //if user is found
    if(users[key]["email"] === email){
      //returns the user object
      return users[key];
    }
  }
  return false;
}

//finds the users URL's with provided user_id
function urlsForUser(id) {
  let result = {}
  for(key in urlDatabase){
    if(urlDatabase[key]["userID"] === id){
      result[key] = urlDatabase[key];
    }
  }
  //returns an object with the current user's URL's
  return result;
}

//Root route
app.get("/", (req, res) => {
  if(req.session.user_id){
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

//Login page
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

//Show Register page
app.get("/register", (req, res) => {
  if(req.session.user_id){
    return res.redirect("/urls");
  }
  let templateVars = {
    user: users[req.session.user_id],
  }
  res.render("urls_register", templateVars);
})

//Create a New Petit URL
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

//View all URL's
app.get("/urls", (req, res) => {
  let usersUrls = urlsForUser(req.session.user_id);
  if(req.session.user_id){
    return res.render("urls_index", { urls: usersUrls, user: users[req.session.user_id] });
  }
  res.render("urls_login", { error: "You must be logged in to do that!" });
});

//URL show and edit page
app.get("/urls/:shortURL", (req, res) => {
  if(!req.session.user_id || req.session.user_id !== users[req.session.user_id]["id"]){
    req.session.error = "You must be logged in to do that!";
    return res.redirect("/login");
  }
  if(!urlDatabase[req.params.shortURL] || req.session.user_id !== urlDatabase[req.params.shortURL]["userID"]){
    return res.send("<html><h1>You have encountered an error. Either this short URL doesn't exist or you do not have access to this page! Please check and try again.</h1></html>")
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

//URL redirector
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

//********Post Routes********

//Create a new petit URL
app.post("/urls", (req, res) => {
  if(req.session.user_id){
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {}
    urlDatabase[shortURL]["longURL"] = req.body.longURL;
    urlDatabase[shortURL]["userID"] = req.session.user_id;
    return res.redirect('/urls/'+ shortURL);
  }
  req.session.error = "You must be logged in to do that!";
  res.redirect("/login");
});

//Edit your petit URL
app.post("/urls/:id", (req, res) => {
  if(!req.session.user_id){
    req.session.error = "You must be logged in to do that!";
    return res.redirect("/login");
  }
  let userUrls = urlsForUser(req.session.user_id);
  if(req.session.user_id === users[req.session.user_id]["id"] && userUrls[req.params.id]){
    let shortURL = `${req.params.id}`
    urlDatabase[shortURL]["longURL"] = req.body.longURL;
    return res.redirect('/urls');
  }
  return res.send("<html><h1>You have encountered an error. Either this short URL doesn't exist or you do not have access to this page! Please check and try again.</h1></html>")
});

//Delete URL
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

//Register a new user
app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password){
    return res.status(400).render("urls_register", { error: "Please enter an email and a password" });
  }
  if(findUserByEmail(req.body.email)){
    return res.status(400).render("urls_register", { error: "This email is already in use" })
  }
  
  //Add the user to the database
  let userId = generateRandomString();
  let hashedPassword = bcrypt.hashSync(req.body.password, 10)
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: hashedPassword 
  }
  req.session.user_id = userId;
  res.redirect('/urls');
})

//User Login
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
  console.log(`Server Started!!! URLpet.it is listening on port ${PORT}!`);
});