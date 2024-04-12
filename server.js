const express = require("express");
const app = express();
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");
var session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);

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

const sessionStore = new MySQLStore({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Import http module
const http = require('http');

// Create a new server using the http module and attach the express app to it
const server = http.createServer(app);

// Import socket.io and attach the server to it
const io = require('socket.io')(server);

// Listen for connections from the client
io.on('connection', (socket) => {
    console.log('New client connected');
    // Handle socket events here
});

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    store: sessionStore,
    secret: 'keyboard duck',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))


//Middleware to add user and authentication status to all responses
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.isAuthenticated = req.session.user !== undefined;
    next();
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

let mediaData= []
//looks for the index.hbs file in the frontend folder
app.get("/", (req, res) => {
    //retrieves the searchQuery
    let searchQuery = req.session.searchQuery || "";
    let sorting = req.session.sorting;
    let onlyDisplay = req.session.onlyDisplay;
    let sortingType = "";
    let onlyDisplayMediaType = "";
    if(sorting == "Rating"){
        sortingType = "ORDER BY AvgRating DESC";
    }else if(sorting=="Alphabetical"){
        sortingType = "ORDER BY Title ASC";
    } else if(sorting=="Popularity"){
        sortingType = "ORDER BY numberOfRatings DESC";
    }

    if(onlyDisplay == "All"){
        onlyDisplayMediaType = ""
    } else if(onlyDisplay == "Movies"){
        onlyDisplayMediaType = "AND tag = 'feature'"
    } else if(onlyDisplay == "Tv-Shows"){
        onlyDisplayMediaType = "AND tag = 'Tv series'"
    } else if(onlyDisplay == "Books"){
        onlyDisplayMediaType = "AND tag = 'Book'"
    }

    //Query the database for all movies containing searchQuery (displays all movies if searchQuery is not defined)
    db.query(`SELECT * FROM media WHERE Title LIKE ? ${onlyDisplayMediaType} ${sortingType}`, [`%${searchQuery}%`], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error retrieving data from database");
        } else {
            //Map the results to an array of objects
            mediaData = result.map(item => ({
                mediaID: item.MediaID,
                title: item.Title,
                avgRating: item.AvgRating,
                tag: item.Tag,
                star: item.Star,
                year: item.Year,
                poster: item.Poster,
                plot: item.Plot,
                numberOfRatings: item.numberOfRatings
            }));

            //checks if the user is an admin
            let adminPermission = false;
            if (req.session.admin) {
                adminPermission = req.session.admin.adminPermission;
            }
            //Render the index.hbs with the data
            res.render('index', { mediaData: mediaData, adminPermission:adminPermission });
        }
    });
});

app.get('/search', (req, res) => {
    //Get the search query from the session
    const query = req.query.query;
    //Save the search query in sessions
    req.session.searchQuery = query;
    res.redirect('/');
});

app.post("/sortBy", (req, res) => {
    const sorting = req.body.sorting
    req.session.sorting = sorting;
    res.redirect('/');
})

app.post("/onlyDisplay", (req, res) => {
    const onlyDisplay = req.body.onlyDisplay
    req.session.onlyDisplay = onlyDisplay;
    res.redirect('/');
})


//renders signUp
app.get("/signUp", (req, res) => {
    res.render("signUp");
});

//renders signIn
app.get("/signIn", (req, res) => {
    res.render("signIn");
});

//renders upload
app.get("/upload", (req, res) => {
    const data = {}; // Replace this with the actual data
    res.render("upload", data);
});

//Handles the post from upload
app.post('/uploadMedia', (req, res) => {
    const uploadData = req.body
    req.session.uploadData = uploadData
    db.query(`SELECT MediaID FROM media WHERE Title = ?`, [uploadData.title], (error, result) => {
        if(result.length != 0){
            console.log("already exists")
            return res.redirect('/');
        }else{
        db.query('INSERT INTO media SET?', {Title: uploadData.title, Tag: uploadData.tag, Star: uploadData.stars, Year: uploadData.year, Poster: uploadData.poster, Plot: uploadData.plot }, (err, result) => {
            return res.redirect('/');
        })
        }
    });
})
/*Handles sign up */
app.post("/signUp", (req, res) => {
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
                        return res.render('signIn', {
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
    db.query('SELECT PersonID, Username, Password FROM users WHERE Username = ?', [name], async (error, result) => {
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
                    //checks if the user is an admin
                    if(result[0].Username == "admin"){
                        if(!req.session.admin) {
                            req.session.admin = {};
                        }
                        req.session.admin.adminPermission = true;
                    }
                    console.log("admin",req.session.admin ? req.session.admin.adminPermission : 'No admin session');
                    // Store user information in the session
                    req.session.user = result[0];
                    return res.redirect('/');

                }else   
                console.log("fel lösenord")                 
                return res.render('signIn', {
                    message: "Fel lösenord"
                })
            });
        }
    })
});

let rated = false
let ratingData = []
//renders media
app.get("/media", (req, res) => {
    //retrieves mediaName variable from the url
    const mediaName = req.query.name;
    //Filter the mediaData array for the media with the given mediaName
    const mediaItem = mediaData.find(item => item.title === mediaName);
    console.log("All data from mediaID",mediaItem)
    req.session.mediaItem = mediaItem; //Store mediaItem in the session


    db.query('SELECT PersonID, MediaID, Rating, Review from ratings WHERE MediaID = ?',[mediaItem.mediaID], async (error, result)=>{
        if(error){http://localhost:4000/
            console.log(error)
        }

        ratingData = result.map(item => ({
            PersonID:item.PersonID,
            MediaID:item.MediaID,
            Rating:item.Rating,
            Review:item.Review
        }));

        const ratingItem = ratingData.find(item => item.PersonID === req.session.user.PersonID);
        if (ratingItem == undefined){
            rated = false
        }else{
            rated = true
        }
        //Render the media.hbs with the data
        res.render('media', { mediaItem: mediaItem,rated: rated, ratingItem:ratingItem});
    });
});

app.post("/rating" ,(req,res) =>{
const rating=req.body.rating
const mediaID= req.session.mediaItem.mediaID;
const personID = req.session.user.PersonID;
console.log("id",mediaID,"rating",rating);
db.query('SELECT PersonID, MediaID FROM ratings WHERE PersonID = ? and MediaID = ?',[personID, mediaID], async (error, result) => {
    console.log("dfslmdfalk",result.length)
    if(error){
        console.log(error)
    }
    //If the ratings is a new rating (not a edited previous rating)
    if(result.length==0){
        db.query('INSERT INTO ratings (PersonID, MediaID, Rating) VALUES (?, ?, ?)', [personID, mediaID, rating], async (error, result) => {
            if(error){
                console.log(error);
            }
            io.emit('new rating added', {newRating:rating});
            calculateAvgRating(mediaID, rating);
        });
    } else{
        db.query('UPDATE ratings SET Rating = ? WHERE PersonID = ? AND MediaID = ?', [rating, personID, mediaID], async (error, result) => {
            if(error){
                console.log(error);
            }
            calculateAvgRating(mediaID, rating);
        });
    }
})
})

app.get('/signOut', function(req, res){
    req.session.destroy(function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("Signed out");
        io.emit('signOut', {message:"Signed out"});
        res.redirect('/');
      }
    });
  });

server.listen(4000, ()=> {
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

function calculateAvgRating(mediaID, rating) {
    //Selects all the Ratings of the specific mediaID
    db.query('SELECT Rating from ratings WHERE MediaID = ?',[mediaID], async (error, result)=>{
        if(error){
            console.log(error)
        }
        let AvgRating = 0;
        //Calculates the average rating
        result.forEach(item => AvgRating += item.Rating);
        //Gets the total number of ratings of the media
        const numberOfRatings = result.length
        //Calculates the average rating and rounds to 2 decimals
        AvgRating = Number((AvgRating/numberOfRatings).toFixed(1));
        console.log("AvgRating",AvgRating)
        //Updates the Average Rating
        db.query('UPDATE media SET AvgRating = ? WHERE MediaID = ?', [AvgRating,mediaID], async(error,result) => {

            db.query('UPDATE media SET numberOfRatings = ? WHERE MediaID = ?', [numberOfRatings,mediaID], async(error,result) => {
                io.emit('Rating updated', {newNumberOfRatings:numberOfRatings,newAvgRating:AvgRating, newRating:rating});
            });
        })
    });
}

//renders admin
app.get("/admin", function(req, res){
    db.query('SELECT * from ratings',async (error, result)=>{
        const allRatingData = result.map(item => ({
            personID: item.PersonID,
            mediaID: item.MediaID,
            rating: item.Rating
        }));
    res.render("admin" ,{mediaData:mediaData, allRatingData:allRatingData});
    });
});

app.post("/admin", function(req, res){
    const mediaName = req.body.mediaName
    console.log(mediaName)
    const mediaItem = mediaData.find(item => item.title === mediaName);
    const mediaItemID=mediaItem.mediaID
    db.query("DELETE FROM ratings WHERE MediaID = ?", [mediaItemID], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error deleting data from database");
        }
    });
    db.query("DELETE FROM media WHERE MediaID = ?", [mediaItemID], (error, result) =>{
        if (error) {
            console.log(error);
            res.status(500).send("Error deleting data from database");
        } else {
            res.redirect('/');
        }
    })
});

