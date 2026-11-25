import { connectDb } from "@/lib/db";
import Order from "@/models/order.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json(
                {error: "Not Authorized"},
                {status: 400}
            );
        }
        
        await connectDb();
        const orders = await Order.find({userId: session.user.id})
            .populate({
                path: "productId",
                select: "name imageUrl",
                options: {
                    strictPopulate: false
                }
            })
            .sort({createdAt: -1})
            .lean()

            return NextResponse.json(
                {orders},
                {status: 200}
            )
        
    } catch (error) {
        console.error(error)
        return NextResponse.json(
                {error: "Something went wrong while payment"},
                {status: 400}
            );
        }
}