const express = require("express");
const cors = require("cors")
const morgan = require("morgan")
const unsubscribeRoute = require('./routes/unsubscribe');
const walletRoutes = require('./routes/wallet');

const app = express();

app.use(express.json());
app.use(cors(""));
app.use(morgan("dev"));


app.get("/", (req, res) => {
    res.send("Hello, world! welcome! to QuickPay");
});

app.get("/api/v1", (req, res) => {
    res.send("Hello, world! welcome! to QuickPay Api");
});


// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1', walletRoutes);
app.use('/api/v1/unsubscribe', unsubscribeRoute);

app.all("*", (req, res) =>  {
    res.send(`${req.method} ${req.originalUrl} is not supported`)
});

module.exports = app;
