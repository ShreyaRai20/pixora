import { connectDb } from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const {email, password} = await request.json()

        if(!email || !password) {
            return NextResponse.json(
                {error: "email and password are required"},
                {status: 400}
            )
        }

        await connectDb()
        const existingUser = await User.findOne({email})
        if (existingUser){
            return NextResponse.json(
                {error: "user with that email already exists"},
                {status: 400}
            )
        }

        await User.create({
            email, 
            password, 
            role: "user"
        })

        return NextResponse.json(
            {message: "User registered successfully"},
            {status: 201}
        )
    } catch (error) {
        console.error("Registration error", error)
        return NextResponse.json(
            {error: "User registration failed"},
            {status: 501}
        )
    }
}