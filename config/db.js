const mongoose =   require("mongoose")
let mongoURI = process.env.mongoURI;

const connectToDB = () => {
    try {
        mongoose.connect(mongoURI)
        console.log("DB connected successfully")
    } catch (error) {
        console.log("Error occured during DB connectrion", err)
    }

}

module.exports = connectToDB;