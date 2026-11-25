import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto"
import { connectDb } from "@/lib/db";
import Order from "@/models/order.model";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
       const signature = request.headers.get("x-razorpay-signature");

       const expectedSignature = crypto
       .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
       .update(body)
       .digest("hex");

       if (expectedSignature !== signature) {
        return NextResponse.json(
            {error: "Invalid signature"},
            {status: 400}
        );
       }

       const event = JSON.parse(body);
       await connectDb();

       if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;

        const order = await Order.findOneAndUpdate(
            {razorpayOrderId: payment.order_id},
            {
                razorpayPaymentId: payment.id,
                status: "completed"
            }
        )
        .populate([
            {path: "productId", select: "name"},
            {path: "userId", select: "email"}
        ])

        if(order) {
            const transport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transport.sendMail({
                    from: `"Your Store" <${process.env.EMAIL_USER}>`,
                    to: (order.userId as any).email,
                    subject: "Payment successful",
                    html: `
                        <h2>Thank you for your purchase!</h2>
                        <p>Your payment for <b>${(order.productId as any).name}</b> was received.</p>
                        <p>Payment ID: ${payment.id}</p>
                    `,
                });
        }
       }
       
       return NextResponse.json(
        {messae: "success"},
        {status: 200}
       )
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}