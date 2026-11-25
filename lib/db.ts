import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in .env");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDb() {
    // reuse existing connection
    if (cached.conn) {
        return cached.conn;
    }

    // create the connection promise once
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,          // correct spelling, fail fast
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000, // give up after 5s with a real error
        };

        cached.promise = mongoose
            .connect(MONGODB_URI, opts)
            .then(() => {
                console.log("connected to db");   // only logs on real success
                return mongoose.connection;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;   // allow retry on next request
        throw error;             // surface the real error
    }

    return cached.conn;
}