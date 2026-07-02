# Belote Game
## Description
This project is an online multiplayer belote game. The project was initially created with Claude (the free version) but with the amount of mistakes it made, I ended up programming the rest by myself.
In this game, you can play with people you know (in theory, for now, you can join any game you want but it's going to be fixed).
The game also offers statistics about players.

### Specific rules

- A game lasts until one of the teams has at least 1000 points.
- There are no "Annonces" nor cancelation when a player has less than 11 points

## Requirements
- Node.js
- Apache
- MySQL

## Used Technologies
- React for the frontend
- PHP for the backend (unfortunately)
- MySQL for the database

## Installation
### Frontend
You need to install Node.js.
Then you need to run these commands :
```
cd frontend
npm install
npm run dev
```
The frontend should be accessible at the URL "https://localhost:3000"

### Backend
I used XAMPP and LAMPP depending on the computer but it should work with MAMP or WAMP.
You need to start Apache and MySQL with the software of your choice.
You also need to create a .env in the /backend folder of the project with the same fields as the .env.example file. Complete the ALLOWED_ORIGIN with the URL of your frontend.

### Database
In the folder sql of the project, you will find two SQL scripts. The one that works with the current project is 'schema_new.sql', the other one is an old one that will not work with the current project.
With XAMPP (or equivalent), you can open PHPMyAdmin, create a new database and run the SQL script to create all the tables.
Then, you need to complete your .env with the credentials of your database (with XAMPP or others, the db_user is going to be "root" and it will have no password)

## Authors
- Alexandra Baivel


