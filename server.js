const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
app.set('views', path.join(__dirname, 'frontend'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'hbs'); // Set Handlebars as the view engine
dotenv.config({path: "./.env"});

const db = mysql.createConnection({
    //värden hämtas från .env
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())

db.connect((error) => {
    if(error){
        console.log(error);
    } else{
        console.log("Ansluten till MySQL");
    }
});

// Använder mallen index.hbs
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.listen(4000, ()=> {
    console.log("Servern körs, besök http://localhost:4000")
})