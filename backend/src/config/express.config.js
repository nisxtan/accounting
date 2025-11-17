const express = require("express");
const router = require("./router.config");
const { AppDataSource } = require("./database");
const app = express();

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

//?initialize the database
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");

    //storing the initialized appdatasource in app settings
    app.set("AppDataSource", AppDataSource);
  })
  .catch((err) => {
    console.error("DB connection error: ", err);
    process.exit(1);
  });

//versioning
app.use("/api/v1", router);

//error handlers
app.use((req, res, next) => {
  next({
    detail: "value",
    message: "Resource not found",
    code: 404,
    status: "RESOURCE_NOT_FOUND",
    options: null,
  });
});

app.use((error, req, res, next) => {
  console.log(error);

  //ensure code is always a number
  let code = 500;
  if (typeof error.code === "number") {
    code = error.code;
  }

  let detail = error.detail || null;
  let message = error.message || null;
  let status = error.status || "";

  res.status(code).json({
    error: detail,
    message: message,
    status: code,
    options: null,
  });
});

module.exports = app;
