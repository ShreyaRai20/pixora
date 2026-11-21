import mongoose from "mongoose"

// get mongodb/db url
const MONGODB_URI = process.env.MONGODB_URI!;

// if db url not present, throw error
if (!MONGODB_URI) {
    throw new Error("Check you mongo db url");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null
    }
}

// function we use to connect to database
export async function connectDb() {
    // connection akready present, send cached connection
    if (cached.conn) {
        return cached.conn;
    }

    // connection not present
    // promise not present create a promise
    if(!cached.promise) {
        const opts = {
            bufferCommand: true,
            maxPoolSize: 10
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then(() => mongoose.connection);
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
    }
    console.log("connected to db")
    return cached.conn;
}