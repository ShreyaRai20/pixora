import { connectDb } from "@/lib/db";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    props: {params: Promise<{id: string}>}
) {
    try {
        const {id} = await props.params;
        await connectDb();

        const product = await Product.findById(id).lean();

        if (!product) {
            return NextResponse.json(
                {error: "No product found"},
                {status: 400}
            )
        }

        return NextResponse.json(
            {product},
            {status: 200}
        )
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            {error: "Failed to fetch product"},
            {status: 400}
        )
    }
}