# Media Management System

This project is a web application built with **Node.js** and **Express**, providing a platform for managing media items such as movies and TV shows. Users can view media details, search and filter items, and leave ratings and reviews. It also includes user authentication and an admin section for media management.

## Features

- **Media Display**: Shows a list of media items with options to filter and sort by rating, popularity, and type.
- **User Authentication**: Users can sign up, sign in, and securely manage their sessions.
- **Rating System**: Users can rate and review media items.
- **Admin Management**: Admins can add or remove media items from the database.
- **API Integration**: Integrates with IMDb’s API to fetch movie and TV show data.

## IMDb Data and Licensing

All media content (e.g., movies and TV shows) is initially retrieved from IMDb via their API and stored in the application’s database. IMDb data is used under the terms of their non-commercial license, which permits non-commercial use as long as it does not compete with IMDb’s services. This application uses IMDb data solely for educational and personal purposes, adhering to IMDb's licensing requirements.

## Tech Stack

- **Node.js** and **Express** for server setup and handling HTTP requests.
- **MySQL** for database management.
- **Express-Handlebars** as the template engine for rendering views.
- **Socket.io** for real-time communication (e.g., rating updates).
- **dotenv** for environment configuration.
- **bcrypt.js** for password hashing.
- **Session Management** using `express-session` and `express-mysql-session` for session storage.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory with the following values:
   ```plaintext
   DATABASE_HOST=your_database_host
   DATABASE_USER=your_database_user
   DATABASE_PASSWORD=your_database_password
   DATABASE=your_database_name
   SESSION_SECRET=your_session_secret
   API_KEY=your_api_key_for_imdb
   API_HOST=your_api_host
   ```

3. **Database Setup**:
   Set up a MySQL database with three main tables: `media`, `users`, and `ratings`. Use the following specifications for each table:

   ### `media` Table
   Stores information about each media item.

   | Column           | Type          | Description                      |
   |------------------|---------------|----------------------------------|
   | `MediaID`        | INT           | Primary key, auto-incrementing   |
   | `Title`          | VARCHAR(255)  | Title of the media item          |
   | `Tag`            | VARCHAR(50)   | Type of media (e.g., movie, TV)  |
   | `Star`           | VARCHAR(255)  | Main actors/stars                |
   | `Year`           | INT           | Release year                     |
   | `Poster`         | VARCHAR(255)  | URL to the poster image          |
   | `Plot`           | TEXT          | Short plot summary               |
   | `AvgRating`      | FLOAT         | Average rating                   |
   | `numberOfRatings`| INT           | Total number of ratings          |

   ### `users` Table
   Stores information about registered users.

   | Column           | Type          | Description                      |
   |------------------|---------------|----------------------------------|
   | `PersonID`       | INT           | Primary key, auto-incrementing   |
   | `Username`       | VARCHAR(50)   | Unique username                  |
   | `Email`          | VARCHAR(255)  | Unique email address             |
   | `Password`       | VARCHAR(255)  | Hashed password                  |

   ### `ratings` Table
   Stores user ratings for each media item.

   | Column           | Type          | Description                      |
   |------------------|---------------|----------------------------------|
   | `PersonID`       | INT           | Foreign key from `users` table   |
   | `MediaID`        | INT           | Foreign key from `media` table   |
   | `Rating`         | INT           | Rating given by the user         |
   | `Review`         | TEXT          | Review text                      |

   Ensure the `PersonID` and `MediaID` fields in the `ratings` table are set up as foreign keys that reference the `users` and `media` tables, respectively. Update your `.env` file with the appropriate database credentials.

4. **Start the Server**:
   ```bash
   node server.js
   ```
   The server runs on `http://localhost:4000`.

## Usage

- **Homepage**: View all media items with options to filter and sort.
- **Sign Up/Sign In**: Users can create an account or log in to leave reviews and ratings.
- **Admin**: Access the `/admin` route for media management (delete items).
- **Rating and Reviews**: Users can add or update ratings on media items, and admins can view all ratings.

## Dependencies

- `express`, `mysql2`, `dotenv`, `express-handlebars`, `socket.io`, `bcryptjs`, `express-session`, `express-mysql-session`

## License

This project is licensed under the MIT License.