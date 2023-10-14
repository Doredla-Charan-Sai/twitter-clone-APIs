const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");
app.use(express.json());

const jwt = require("jsonwebtoken");

const path = require("path");
const dbpath = path.join(__dirname, "twitterClone.db");

let db = null;

let payload = "";

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const searchUserInTable = `select * from user where username like '${username}';`;
  const dbSearchResponse = await db.get(searchUserInTable);
  if (dbSearchResponse !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length > 5) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const registerUserInUserTb = `insert into user (username,password, name, gender) values ('${username}','${hashedPassword}', '${name}', '${gender}');`;
      await db.run(registerUserInUserTb);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  }
});

// API 2

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const searchUserInTable = `select * from user where username like '${username}';`;
  const dbSearchResponse = await db.get(searchUserInTable);

  if (dbSearchResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    isPasswordMatched = await bcrypt.compare(
      password,
      dbSearchResponse.password
    );
    if (isPasswordMatched) {
      payload = { username: username };
      const jwtToken = jwt.sign(payload, "MY_SCRETE");
      console.log(jwtToken);
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// Authentication with jwt token

const authenticate = (request, response, next) => {
  const { authorization } = request.headers;
  let jwtToken;
  if (authorization !== undefined) {
    jwtToken = authorization.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SCRETE", (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

// API 3

const funForAPI3 = (item) => {
  return {
    username: item.username,
    tweet: item.tweet,
    dateTime: item.date_time,
  };
};

app.get("/user/tweets/feed/", authenticate, async (request, response) => {
  const { username } = request;
  const getUserIdQuery = `select user_id from user where username = '${username}';`;
  const dbUserIdResponse = await db.get(getUserIdQuery);
  //const userId = dbUserIdResponse.user_id;
  const getFollowingUsersQuery = `select following_user_id from follower where follower_user_id = ${dbUserIdResponse.user_id};`;
  const dbFollowingUsers = await db.all(getFollowingUsersQuery);
  let followingUsersArray = [];
  dbFollowingUsers.map((eachObj) =>
    followingUsersArray.push(eachObj.following_user_id)
  );
  //console.log(followingUsersArray);
  const getAPI3Query = `select user.username, tweet.tweet, tweet.date_time from tweet left join user on tweet.user_id = user.user_id where tweet.user_id in (${followingUsersArray}) order by tweet.date_time desc limit 4 offset 0;`;
  const dbAPI3Response = await db.all(getAPI3Query);
  response.send(dbAPI3Response.map((eachItem) => funForAPI3(eachItem)));
});

const funForAPI45 = (item) => {
  return {
    name: item.name,
  };
};

// API 4
app.get("/user/following/", authenticate, async (request, response) => {
  const { username } = request;
  const getUserIdQuery = `select user_id from user where username = '${username}';`;
  const dbUserIdResponse = await db.get(getUserIdQuery);
  //const userId = dbUserIdResponse.user_id;
  //console.log(dbUserIdResponse);
  const getFollowingUsersQuery = `select following_user_id from follower where follower_user_id = ${dbUserIdResponse.user_id};`;
  const dbFollowingUsers = await db.all(getFollowingUsersQuery);
  let followingUsersArray = [];
  dbFollowingUsers.map((eachObj) =>
    followingUsersArray.push(eachObj.following_user_id)
  );
  const getAPI4Query = `select name from user where user_id in (${followingUsersArray}) ;`;
  const dbAPI4Response = await db.all(getAPI4Query);
  response.send(dbAPI4Response.map((eachItem) => funForAPI45(eachItem)));
});

// API 5

app.get("/user/followers/", authenticate, async (request, response) => {
  const { username } = request;
  const getUserIdQuery = `select user_id from user where username = '${username}';`;
  const dbUserIdResponse = await db.get(getUserIdQuery);
  //const userId = dbUserIdResponse.user_id;
  //console.log(dbUserIdResponse);
  const getFollowingUsersQuery = `select follower_user_id from follower where following_user_id = ${dbUserIdResponse.user_id};`;
  const dbFollowingUsers = await db.all(getFollowingUsersQuery);
  let followingUsersArray = [];
  dbFollowingUsers.map((eachObj) =>
    followingUsersArray.push(eachObj.follower_user_id)
  );
  const getAPI5Query = `select name from user where user_id in (${followingUsersArray}) ;`;
  //console.log(followingUsersArray);
  const dbAPI5Response = await db.all(getAPI5Query);

  response.send(dbAPI5Response.map((eachItem) => funForAPI45(eachItem)));
});

// API 6

const funForAPI6 = (item1, item2, item3) => {
  return {
    tweet: item1.tweet,
    likes: item2.likes,
    replies: item3.replies,
    dateTime: item1.dateTime,
  };
};

app.get("/tweets/:tweetId/", authenticate, async (request, response) => {
  const { username } = request;
  const { tweetId } = request.params;
  const getUserIdQuery = `select user_id from user where username = '${username}';`;
  const dbUserIdResponse = await db.get(getUserIdQuery);
  //const userId = dbUserIdResponse.user_id;
  //console.log(dbUserIdResponse);
  const getFollowingUsersQuery = `select following_user_id from follower inner join user on follower.following_user_id = user.user_id where follower_user_id = ${dbUserIdResponse.user_id};`;
  const dbFollowingUsers = await db.all(getFollowingUsersQuery);
  let followingUsersArray = [];
  dbFollowingUsers.map((eachObj) =>
    followingUsersArray.push(eachObj.following_user_id)
  );
  const getTweetIdQuery = `select tweet_id from tweet where user_id in (${followingUsersArray});`;
  const dbTweetIdResponse = await db.all(getTweetIdQuery);
  let tweetIdsArray = [];
  dbTweetIdResponse.map((eachTweetId) =>
    tweetIdsArray.push(eachTweetId.tweet_id)
  );
  //console.log(tweetIdsArray);
  //console.log(tweetIdsArray.includes(Number(tweetId)));
  if (tweetIdsArray.includes(Number(tweetId))) {
    const getLikesCount = `select count(like_id) as likes from like where tweet_id = ${tweetId};`;
    const dbLikesResponse = await db.get(getLikesCount);
    const getRepliesCount = `select count(reply_id) as replies from reply where tweet_id = ${tweetId};`;
    const dbRepliesResponse = await db.get(getRepliesCount);
    const getAPI6Query = `select tweet, date_time as dateTime from tweet where tweet_id = ${tweetId};`;
    const dbAPI6Response = await db.get(getAPI6Query);
    response.send(
      funForAPI6(dbAPI6Response, dbLikesResponse, dbRepliesResponse)
    );
  } else {
    response.status(401);
    response.send("Invalid Request");
  }
});

// API 7
const funForAPI7 = (item) => {
  let a = [];
  const result = item.map((eachObj7) => a.push(eachObj7.likes));
  return {
    likes: a,
  };
};
app.get("/tweets/:tweetId/likes/", authenticate, async (request, response) => {
  const { username } = request;
  const { tweetId } = request.params;
  const getLoggedInUserId = `select user_id from user where username = '${username}';`;
  const dbUserIdResponse = await db.get(getLoggedInUserId);
  const getFollowingUsers = `select following_user_id from follower where follower_user_id in (${dbUserIdResponse.user_id});`;
  const dbFollowingUserId = await db.all(getFollowingUsers);
  let followingUsersArray = [];
  dbFollowingUserId.map((eachObj) =>
    followingUsersArray.push(eachObj.following_user_id)
  );
  const getTweetIdQuery = `select tweet_id from tweet where user_id in (${followingUsersArray});`;
  const dbTweetIdResponse = await db.all(getTweetIdQuery);
  let tweetIdsArray = [];
  dbTweetIdResponse.map((eachTweetId) =>
    tweetIdsArray.push(eachTweetId.tweet_id)
  );
  if (tweetIdsArray.includes(Number(tweetId))) {
    const getAPI7Query = `select username as likes from user where user_id in (select user_id from like where tweet_id = ${tweetId});`;
    const dbAPI7Response = await db.all(getAPI7Query);
    response.send(funForAPI7(dbAPI7Response));
  } else {
    response.status(401);
    response.send("Invalid Request");
  }
});

// API 8
const funForAPI8 = (item) => {
  let newArrFor8 = [];
  item.map((eachObj8) => newArrFor8.push(eachObj8));
  return {
    replies: newArrFor8,
  };
};

app.get(
  "/tweets/:tweetId/replies/",
  authenticate,
  async (request, response) => {
    const { username } = request;
    const { tweetId } = request.params;
    const getLoggedInUserId = `select user_id from user where username = '${username}';`;
    const dbUserIdResponse = await db.get(getLoggedInUserId);
    const getFollowingUsers = `select following_user_id from follower where follower_user_id in (${dbUserIdResponse.user_id});`;
    const dbFollowingUserId = await db.all(getFollowingUsers);
    let followingUsersArray = [];
    dbFollowingUserId.map((eachObj) =>
      followingUsersArray.push(eachObj.following_user_id)
    );
    const getTweetIdQuery = `select tweet_id from tweet where user_id in (${followingUsersArray});`;
    const dbTweetIdResponse = await db.all(getTweetIdQuery);
    let tweetIdsArray = [];
    dbTweetIdResponse.map((eachTweetId) =>
      tweetIdsArray.push(eachTweetId.tweet_id)
    );
    if (tweetIdsArray.includes(Number(tweetId))) {
      const getAPI8Query = `select user.name,reply.reply from reply left join user on reply.user_id = user.user_id where  tweet_id = ${tweetId};`;
      const dbAPI8Response = await db.all(getAPI8Query);
      response.send(funForAPI8(dbAPI8Response));
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

// API 9

app.get("/user/tweets/", authenticate, async (request, response) => {
  const { username } = request;
  const getLoggedInUserId = `select user_id from user where username = '${username}';`;
  const dbUserIdResponse = await db.get(getLoggedInUserId);

  const getAPI9Query = `select
        tweet.tweet as tweet, 
        count(distinct(like.like_id)) as likes,
        count(distinct(reply.reply_id)) as replies,
        tweet.date_time as dateTime
    from
        (((user inner join tweet on user.user_id = tweet.user_id) inner join like on like.tweet_id = tweet.tweet_id) inner join reply on reply.tweet_id = tweet.tweet_id)
    where 
        user.user_id = ${dbUserIdResponse.user_id}
    group by
        tweet.tweet_id;`;

  const dbAPI9Response = await db.all(getAPI9Query);
  response.send(dbAPI9Response);
});

// API 10

app.post("/user/tweets/", authenticate, async (request, response) => {
  const { username } = request;
  const getLoggedInUserId = `select user_id from user where username = '${username}';`;
  const dbUserIdResponse = await db.get(getLoggedInUserId);
  const { tweet } = request.body;
  const createAPI10Query = `insert into tweet (tweet,user_id) values ('${tweet}',${dbUserIdResponse.user_id});`;
  await db.run(createAPI10Query);
  response.send("Created a Tweet");
});

// API 11

app.delete("/tweets/:tweetId/", authenticate, async (request, response) => {
  const { username } = request;
  const getLoggedInUserId = `select user_id from user where username = '${username}';`;
  const dbUserIdResponse = await db.get(getLoggedInUserId);
  const { tweetId } = request.params;
  const getTweetIdQuery = `select tweet_id from tweet where user_id = ${dbUserIdResponse.user_id};`;
  const dbTweetIdResponse = await db.all(getTweetIdQuery);
  let tweetIdsArray = [];
  dbTweetIdResponse.map((eachTweetId) =>
    tweetIdsArray.push(eachTweetId.tweet_id)
  );
  if (tweetIdsArray.includes(Number(tweetId))) {
    const deleteAPI11Query = `delete from tweet where tweet_id = ${tweetId} and user_id = ${dbUserIdResponse.user_id};`;
    await db.run(deleteAPI11Query);
    response.send("Tweet Removed");
  } else {
    response.status(401);
    response.send("Invalid Request");
  }
});
module.exports = app;
