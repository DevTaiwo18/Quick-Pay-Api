const dotenv = require('dotenv').config();
const app = require('./app');
const connectToDB = require('./config/db');

connectToDB()

let port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log('App is listening on port ' + port);
})