// Importing Mongoose library to interact with MongoDB
import mongoose from "mongoose";

// Importing a constant `DB_NAME` from another file that specifies the database name
import { DB_NAME } from "../constant.js";

// Defining an asynchronous function to connect to the MongoDB database
const connectDB = async () => {
    try {
        // Connect to MongoDB using the connection string from the environment variables and database name
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}` // Combines the base URI and database name
        );

        // Log a success message when the connection is established
        console.log(`MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        // Log the error message if the connection fails
        console.log("MONGODB CONNECTION ERROR: ", error);

        // Exit the Node.js process with a non-zero status code to indicate failure
        process.exit(1);
    }
};

// Export the `connectDB` function as the default export of this module
export default connectDB;
