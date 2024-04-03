const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");
var session = require('express-session')

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

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())

db.connect((error) => {
    if(error){
        console.log(error);
    } else{
        console.log("Ansluten till MySQL");
    }
});


//looks for the index.hbs file in the frontend folder
app.get("/", (req, res) => {
    //Query the database for all movies
    db.query('SELECT MediaID, Title, AvgRating, Description, tag FROM media', (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error retrieving data from database");
        } else {
            //Map the results to an array of objects
            const mediaData = result.map(item => ({
                title: item.Title,
                avgRating: item.AvgRating,
                description: item.Description,
                tag: item.tag
            }));
            //Render the index.hbs with the data
            res.render("index", { mediaData: mediaData });
        }
    });
});

app.get("/signUp", (req, res) => {
    res.render("signUp");
});

app.get("/signIn", (req, res) => {
    res.render("signIn");
});

/*Handles sign up */
app.post("/signUp", (req, res) => {
    console.log("submitted")
    //Variabel för hur ett korrekt lösenord ska se ut
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    //Variabel för hur korrekt email ska se ut
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const{name, email, password, password_confirm} = req.body

    //kollar om lösenordet är korrekt skrivet
    if(!passwordRegex.test(password)){
        return res.render('signUp', {
            message: "Password must contain atleasy 8 characters, atleast one number and one letter"
        })
    }

    //testar om den angivna emailen är korrekt
    if (!emailRegex.test(email)){
        return res.render('signUp', {
            message: "Not a correct email"
        })
    }

    //kollar om password är matchande
    if (password != password_confirm){
        return res.render('signUp', {
            message: "Passwords do not match"
        })
    }

    //Om inte alla fälten är i fyllda
    if (!name || !email || !password || !password_confirm){
        return res.render('signUp', {
            message: "All fields are not filled out"
        })
    }

    db.query('SELECT Username, Email FROM users WHERE Username = ? or Email = ?', [name, email], (error, result) => {
        if(error){
            console.log(error)
        }
        //Om == 0 så finns inte användaren
        if( result.length != 0 ) {
            return res.render('signUp', {
                message: "User alaredy exists"
            }) 
        } else{

            //krypterar lösenordet
            cryptPassword(password, (err, hash)=>{
                if(err){
                    console.log("An error occured")
                }else{
                //Lägger till användare med det krypterade lösenordet
                db.query('INSERT INTO users SET?', {Username: name, Email: email, Password: hash}, (err, result) => {
                    if(err) {
                        console.log(err)
                    } else {
                        return res.render('signUp', {
                            message: 'User registered'
                        })
                    }       
            })
                }
            });
        }
    })
});


/*Handles sign in */
app.post("/signIn", (req, res) => {
    const { name, password } = req.body
    db.query('SELECT Username, Password FROM users WHERE Username = ?', [name], async (error, result) => {
        if(error){
            console.log(error)
        }
        // Om == 0 så finns inte användaren
        if( result.length == 0 ) {
            return res.render('signIn', {
                message: "Användaren finns ej"
            }) 

        } else {
            //Vi kollar om lösenordet som är angivet matchar det i databasen
            bcrypt.compare(password, result[0].Password, function(err, isMatch) {
                if (isMatch) {
                    //password is valid
                    app.use(session({
                        genid: function(req) {
                          return genuuid() // use UUIDs for session IDs
                        },
                        secret: 'keyboard cat'
                      }))
                    return res.render('index', {
                    })
                }else   
                console.log("fel lösenord")                 
                return res.render('signIn', {
                    message: "Fel lösenord"
                })
            });
        }
    })
});

app.get('/search', (req, res) => {
    const query = req.query.query; // Retrieve the search query from the query parameters
    // Perform a search for movies based on the query
    // Return search results to the client
    const responseText = "Your search query was: " + query;
    // Send the response as plain text
    res.send(responseText);
});

app.listen(4000, ()=> {
    console.log("Servern körs, besök http://localhost:4000")
})

//Krypterar lösenordet
function cryptPassword(password, callback){
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, function(err, hash) {
        callback(err, hash)
        });
        
    })
}


/*How to handle the search later


app.get('/search', (req, res) => {
    const query = req.query.query; // Retrieve the search query from the query parameters
    // Perform a search for movies based on the query
    // Return search results to the client
});
*/