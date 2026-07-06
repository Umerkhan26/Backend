import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 7000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });
/*
import mongoose from "mongoose";
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}`);
    app.on("error", (error) => {
      console.log("Error: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listing on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
})();

*/

// require(`dotenv`).config();
// const express = require("express");
// // import express from "express";
// const app = express();
// const port = 4000;

// const GithubData = {
//   login: "hiteshchoudhary",
//   id: 11613311,
//   node_id: "MDQ6VXNlcjExNjEzMzEx",
//   avatar_url: "https://avatars.githubusercontent.com/u/11613311?v=4",
//   gravatar_id: "",
//   url: "https://api.github.com/users/hiteshchoudhary",
//   html_url: "https://github.com/hiteshchoudhary",
//   followers_url: "https://api.github.com/users/hiteshchoudhary/followers",
//   following_url:
//     "https://api.github.com/users/hiteshchoudhary/following{/other_user}",
//   gists_url: "https://api.github.com/users/hiteshchoudhary/gists{/gist_id}",
//   starred_url:
//     "https://api.github.com/users/hiteshchoudhary/starred{/owner}{/repo}",
//   subscriptions_url:
//     "https://api.github.com/users/hiteshchoudhary/subscriptions",
//   organizations_url: "https://api.github.com/users/hiteshchoudhary/orgs",
//   repos_url: "https://api.github.com/users/hiteshchoudhary/repos",
//   events_url: "https://api.github.com/users/hiteshchoudhary/events{/privacy}",
//   received_events_url:
//     "https://api.github.com/users/hiteshchoudhary/received_events",
//   type: "User",
//   user_view_type: "public",
//   site_admin: false,
//   name: "Hitesh Choudhary",
//   company: null,
//   blog: "https://www.youtube.com/c/HiteshChoudharydotcom",
//   location: "India",
//   email: null,
//   hireable: null,
//   bio: "I make coding videos on youtube and for courses. My youtube channel explains my work more. Check that out",
//   twitter_username: "hiteshdotcom",
//   public_repos: 110,
//   public_gists: 5,
//   followers: 44527,
//   following: 0,
//   created_at: "2015-03-23T13:03:25Z",
//   updated_at: "2025-05-17T16:49:07Z",
// };

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.get("/email", (req, res) => {
//   res.send("Umerkhattax@gmail.com");
// });

// app.get("/login", (req, res) => {
//   res.send(`<h1> Please Login the User </h1>`);
// });

// app.get("/github", (req, res) => {
//   res.json(GithubData);
// });

// // Get a list of 5 jokes

// app.get("/jokes", (req, res) => {
//   const jokes = [
//     {
//       id: 1,
//       title: "A Joke",
//       content: "This is a Joke",
//     },
//     {
//       id: 2,
//       title: "ANother Joke",
//       content: "This is another Joke",
//     },
//     {
//       id: 3,
//       title: "A Third Joke",
//       content: "This is third Joke",
//     },
//     {
//       id: 4,
//       title: "A  fourth Joke",
//       content: "This is fourth Joke",
//     },
//     {
//       id: 5,
//       title: "A  fifth Joke",
//       content: "This is fifth Joke",
//     },
//   ];
//   res.send(jokes);
// });

// app.listen(process.env.PORT, () => {
//   console.log(`Example app listening on port ${port}`);
// });

// app.use(cors()) : use specically used for middleware and configuration of teh app.
