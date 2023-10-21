const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieSession = require("cookie-session");
require('dotenv').config();

const app = express();
const PORT = 3000;
const SECRET = process.env.COOKIE_SECRET;

app.use(
   cookieSession({
     name: "sess",
     keys: [SECRET], // should use as secret environment variable
     httpOnly: true
   })
 );

app.use(express.json());
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/signup', (req, res) => {
   res.sendFile(path.join(__dirname, 'public/signup.html'));
});

//handle the signup logic
app.post('/signup', (req, res) => {

})

app.get('/login', (req, res) => {
   res.sendFile(path.join(__dirname, 'public/login.html'));
});

//handle the login logic
app.post('/login', (req, res) => {

})

app.listen(PORT, () => {
   console.log(`Server started on http://localhost:${PORT}`);
});