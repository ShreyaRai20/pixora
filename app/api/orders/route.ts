import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import Order from "@/models/order.model";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json(
                {error: "Not Authorized"},
                {status: 400}
            );
        }

        const {productId, variant} = await request.json();
        await connectDb();

        const order = await razorpay.orders.create({
            "amount": Math.round(variant.price * 100),
            "currency": "USD",
            "receipt": `receipt-${Date.now()}`,
            "partial_payment": false,
            "notes": {
                productId: productId.toString(),
            }
        });

        const newOrder = await Order.create({
                userId: session.user?.id,
                productId: productId,
                variant: variant,
                razorpayOrderId: order.id,
                amount: Math.round(variant.price * 100),
                status: "pending"
        });

        return NextResponse.json(
            {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                dbOrderId: newOrder._id
            },
            {status: 201}
        )

    } catch (error) {
        console.error(error)
        return NextResponse.json(
            {error: "Something went wrong while payment"},
            {status: 400}
        );
    }
}