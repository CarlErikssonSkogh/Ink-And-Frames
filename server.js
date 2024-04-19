const express = require("express");
const app = express();
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");
var session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);
const expressHbs = require('express-handlebars');

dotenv.config({path: "./.env"});

//Create an instance of express-handlebars with header.hbs as default layout
const hbs = expressHbs.create({
    layoutsDir: path.join(__dirname, 'frontend'),
    defaultLayout: 'header',
    extname: '.hbs'
});

//Function that reduces titles that are to long
hbs.handlebars.registerHelper('reduce', function (str) {
    if (str && str.length > 57) {
        //returns a new string 57 characters long ending with "..."
        return str.substring(0, 57) + '...';
    } else {
        //If the string isn't to long it's just returned in it's original form
        return str;
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs'); // Set Handlebars as the view engine
app.set('views', path.join(__dirname, 'frontend'));
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    //värden hämtas från .env
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

//Crates a database for the session
const sessionStore = new MySQLStore({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

//Import http module
const http = require('http');

//Create a new server using the http module and attach the express app to it
const server = http.createServer(app);

//Import socket.io and attach the server to it
const io = require('socket.io')(server);

//Listen for connections from the client
io.on('connection', (socket) => {
    console.log('New client connected');
});

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
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

    //Handles the sorting
    if(sorting == "Rating"){
        sortingType = "ORDER BY AvgRating DESC";
    }else if(sorting=="Alphabetical"){
        sortingType = "ORDER BY Title ASC";
    } else if(sorting=="Popularity"){
        sortingType = "ORDER BY numberOfRatings DESC";
    }

    //Handles what media should be displayed
    if(onlyDisplay == "All"){
        onlyDisplayMediaType = ""
    } else if(onlyDisplay == "Movies"){
        onlyDisplayMediaType = "AND tag = 'feature'"
    } else if(onlyDisplay == "Tv-Shows"){
        onlyDisplayMediaType = "AND tag = 'Tv series'"
    } else if(onlyDisplay == "Not rated"){
        onlyDisplayMediaType = "AND tag = 'Book'"
    }

    //Query the database for all movies containing searchQuery (displays all movies if searchQuery is not defined), 
    //also adds the sorting or only display if it is given, if it is not given it will just be an empty string and do nothing
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

//gets the search
app.get('/search', (req, res) => {
    //Get the search query from the session
    const query = req.query.query;
    //Save the search query in sessions
    req.session.searchQuery = query;
    res.redirect('/');
});

//retrieve the post about how the media should be sorted
app.post("/sortBy", (req, res) => {
    const sorting = req.body.sorting
    req.session.sorting = sorting;
    res.redirect('/');
})

//retrieves the post on what should be displayed
app.post("/onlyDisplay", (req, res) => {
    const onlyDisplay = req.body.onlyDisplay
    req.session.onlyDisplay = onlyDisplay;
    res.redirect('/');
})


//renders signUp
app.get("/signUp", (req, res) => {
    res.render("signUp",{ layout: null });
});

//renders signIn
app.get("/signIn", (req, res) => {
    res.render("signIn",{ layout: null });
});

//signs the user out
app.get('/signOut', function(req, res){
    //removes the user from the session
    req.session.destroy(function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("Signed out");
        //emits that the user has been removed from the session and logged out
        io.emit('signOut', {message:"Signed out"});
        res.redirect('/');
      }
    });
  });

//renders upload
app.get("/upload", (req, res) => {
    const data = {}; // Replace this with the actual data
    res.render("upload", data);
});

//Handles the search from upload.hbs
app.post('/uploadSearch', async (req, res) => {
    //gets the search value
    const search = req.body.search

    //creates the url with the search value
    const url = `https://imdb8.p.rapidapi.com/auto-complete?q=${search}`;

    //the options for the fetch, uses the API_KEY provided by rapid API
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': process.env.API_KEY,
            'X-RapidAPI-Host': process.env.API_HOST
        }
    };
    
    try {
      //requests information to the API with the url created from the search value
      const response = await fetch(url, options);
      const result = await response.json();

      //extracts the information that is wanted
      const list = result.d;

      //sends the data back to the frontend to be handled
      res.json({list:list});
    }catch (error) {
        console.error(error);
      }
});

//handles the plot information
app.post('/getPlot', async (req, res) => {
    //the options for the fetch, uses the API_KEY provided by rapid API
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': process.env.API_KEY,
            'X-RapidAPI-Host': process.env.API_HOST
        }
    };
    //retrieves the value sent by the frontend (this is the id of a specific movie)
    const id = req.body.id

    //creates a new url (get-plot) with the id of the media
    const plotUrl = `https://imdb8.p.rapidapi.com/title/v2/get-plot?tconst=${id}`;
    //fetch the plot
      const plotResponse = await fetch(plotUrl, options);
      //get the results in json
      const plotResult = await plotResponse.json();
      //get the plot of the movie in plain text
      const plot = plotResult.data.title.plot.plotText.plainText;
      //send it to the frontend
      res.json({plot:plot})
})

//Handles the post from upload
app.post('/uploadMedia', (req, res) => {
    const uploadData = req.body
    req.session.uploadData = uploadData
    //Selects MediaID from a specific title
    db.query(`SELECT MediaID FROM media WHERE Title = ?`, [uploadData.title], (error, result) => {
        //Checks if it already exists
        if(result.length != 0){
            console.log("already exists")
            return res.redirect('/');
        }else{
        //if it does not exist add it to the data base and redirect the user to the main page
        db.query('INSERT INTO media SET?', {Title: uploadData.title, Tag: uploadData.tag, Star: uploadData.stars, Year: uploadData.year, Poster: uploadData.poster, Plot: uploadData.plot }, (err, result) => {
            return res.redirect('/');
        })
        }
    });
})
/*Handles sign up */
app.post("/signUp", (req, res) => {
    //Variabel for how a correct password should look
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    //Variabel for how a correct email should look
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const{name, email, password, password_confirm} = req.body

    //Tests the password
    if(!passwordRegex.test(password)){
        return res.render('signUp', {
            message: "Password must contain atleasy 8 characters, atleast one number and one letter"
        })
    }

    //Tests the email
    if (!emailRegex.test(email)){
        return res.render('signUp', {
            message: "Not a correct email"
        })
    }

    //Checks if password and password_confirm matches
    if (password != password_confirm){
        return res.render('signUp', {
            message: "Passwords do not match"
        })
    }

    //If all the fields are not filled
    if (!name || !email || !password || !password_confirm){
        return res.render('signUp', {
            message: "All fields are not filled out"
        })
    }

    db.query('SELECT Username, Email FROM users WHERE Username = ? or Email = ?', [name, email], (error, result) => {
        if(error){
            console.log(error)
        }
        //If == 0 the user does not exist
        if( result.length != 0 ) {
            return res.render('signUp', {
                message: "User alaredy exists"
            }) 
        } else{

            //Crypts the password
            cryptPassword(password, (err, hash)=>{
                if(err){
                    console.log("An error occured")
                }else{
                //Adds users to the database with the crypted password
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
        //if == 0 the user does not exist
        if( result.length == 0 ) {
            return res.render('signIn', {
                message: "Användaren finns ej"
            }) 

        } else {
            //If the given password matches the password in the database
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
                    //Store user information in the session
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

    //Selects everything from ratings of a specific media
    db.query('SELECT PersonID, MediaID, Rating, Review from ratings WHERE MediaID = ?',[mediaItem.mediaID], async (error, result)=>{
        if(error){
            console.log(error)
        }
        //Maps all the rating data from a specific media
        ratingData = result.map(item => ({
            PersonID:item.PersonID,
            MediaID:item.MediaID,
            Rating:item.Rating,
            Review:item.Review
        }));

        //creates a variable with all the ratings on a specific media and the logged in user
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

//Handles the ratings from the frontend
app.post("/rating" ,(req,res) =>{
const rating=req.body.rating
const mediaID= req.session.mediaItem.mediaID;
const personID = req.session.user.PersonID;

//selects data from a specific media posted by a specific user
db.query('SELECT PersonID, MediaID FROM ratings WHERE PersonID = ? and MediaID = ?',[personID, mediaID], async (error, result) => {
    if(error){
        console.log(error)
    }
    //If the ratings is a new rating (not a edited previous rating), inserts the rating
    if(result.length==0){
        db.query('INSERT INTO ratings (PersonID, MediaID, Rating) VALUES (?, ?, ?)', [personID, mediaID, rating], async (error, result) => {
            if(error){
                console.log(error);
            }
            //Emits that the rating was added
            io.emit('new rating added', {newRating:rating});
            //calls a function to handle the calculations for AvgRating
            calculateAvgRating(mediaID, rating);
        });
    } else{
        //If it's not a new ratings and instead just a updated rating, Updated the rating
        db.query('UPDATE ratings SET Rating = ? WHERE PersonID = ? AND MediaID = ?', [rating, personID, mediaID], async (error, result) => {
            if(error){
                console.log(error);
            }
            //calls a function to handle the calculations for AvgRatings
            calculateAvgRating(mediaID, rating);
        });
    }
})
})



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
    //renders admin.hbs with the nessecary data
    res.render("admin" ,{mediaData:mediaData});
    });
});

//Handles the removal of media in admin.hbs
app.post("/admin", function(req, res){
    //gets the media name of the clicked media in admin.hbs
    const mediaName = req.body.mediaName
    //gets the all the information about the specific media
    const mediaItem = mediaData.find(item => item.title === mediaName);
    const mediaItemID=mediaItem.mediaID

    //Deletes all the ratings made on the media
    db.query("DELETE FROM ratings WHERE MediaID = ?", [mediaItemID], (error, result) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error deleting data from database");
        }
    });

    //When all the ratings are removed the media itself can be safely removed
    db.query("DELETE FROM media WHERE MediaID = ?", [mediaItemID], (error, result) =>{
        if (error) {
            console.log(error);
            res.status(500).send("Error deleting data from database");
        } else {
            res.redirect('/');
        }
    })
});

