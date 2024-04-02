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

app.get("/register", (req, res) => {
    res.render("register");
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


/*How to handle the search later


app.get('/search', (req, res) => {
    const query = req.query.query; // Retrieve the search query from the query parameters
    // Perform a search for movies based on the query
    // Return search results to the client
});
*/