import { Schema, model, models, Model } from "mongoose";
import { IMAGE_VARIANTS, IImageVariant, IProduct } from "@/lib/product-types";

export { IMAGE_VARIANTS };
export type { IImageVariant, IProduct };

const imageVariantSchema = new Schema<IImageVariant>({
    type: { type: String, required: true, enum: Object.keys(IMAGE_VARIANTS) },
    price: { type: Number, required: true, min: 0 },
    license: { type: String, required: true, enum: ["personal", "commercial"] },
});

const productSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        imageUrl: { type: String, required: true },
        variants: [imageVariantSchema],
    },
    { timestamps: true }
);

const Product = (models.Product as Model<IProduct>) || model<IProduct>("Product", productSchema);

export default Product;