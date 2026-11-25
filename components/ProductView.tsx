"use client";

import { Image, type Transformation } from "@imagekit/next";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, Check, Image as ImageIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import {
    IImageVariant,
    IMAGE_VARIANTS,
    ImageVariantType,
    IProduct,
} from "@/lib/product-types";
import { useNotification } from "@/components/Notification";

// must match the currency used when the Razorpay order is created on the server
const CURRENCY = "USD";

export default function ProductView() {
    const params = useParams();
    const [product, setProduct] = useState<IProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<IImageVariant | null>(
        null
    );
    const { showNotification } = useNotification();
    const router = useRouter();
    const { data: session } = useSession();

    useEffect(() => {
        const fetchProduct = async () => {
            const id = params?.id;

            if (!id) {
                setError("Product ID is missing");
                setLoading(false);
                return;
            }

            try {
                const data = await apiClient.getProduct(id.toString());
                // API may return { product: {...} } or the product itself
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const found = (data as any)?.product ?? data;
                if (!found || !Array.isArray(found.variants)) {
                    throw new Error("Product not found");
                }
                setProduct(found as IProduct);
            } catch (err) {
                console.error("Error fetching product:", err);
                setError(err instanceof Error ? err.message : "Failed to load product");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [params?.id]);

    const handlePurchase = async (variant: IImageVariant) => {
        if (!session) {
            showNotification("Please login to make a purchase", "error");
            router.push("/login");
            return;
        }

        if (!product?._id) {
            showNotification("Invalid product", "error");
            return;
        }

        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
            showNotification("Razorpay key is missing", "error");
            return;
        }

        try {
            const { orderId, amount } = await apiClient.createOrder({
                productId: product._id,
                variant,
            });

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount,
                currency: CURRENCY,
                name: "ImageKit Shop",
                description: `${product.name} - ${variant.type} Version`,
                order_id: orderId,
                handler: function () {
                    showNotification("Payment successful!", "success");
                    router.push("/orders");
                },
                prefill: {
                    email: session.user?.email ?? "",
                },
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Razorpay = (window as any).Razorpay;
            if (!Razorpay) {
                showNotification("Payment script is still loading, try again", "error");
                return;
            }

            const rzp = new Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error(err);
            showNotification(
                err instanceof Error ? err.message : "Payment failed",
                "error"
            );
        }
    };

    const getTransformation = (variantType: ImageVariantType): Transformation[] => {
        const variant = IMAGE_VARIANTS[variantType];
        return [
            {
                width: variant.dimensions.width,
                height: variant.dimensions.height,
                cropMode: "extract",
                focus: "center",
                quality: 60,
            },
        ];
    };

    if (loading)
        return (
            <div className="min-h-[70vh] flex justify-center items-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );

    if (error || !product)
        return (
            <div className="alert alert-error max-w-md mx-auto my-8">
                <AlertCircle className="w-6 h-6" />
                <span>{error || "Product not found"}</span>
            </div>
        );

    const isSelected = (v: IImageVariant) =>
        selectedVariant?.type === v.type && selectedVariant?.license === v.license;

    return (
        <div className="container mx-auto px-4 py-8">
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Section */}
                <div className="space-y-4">
                    <div
                        className="relative rounded-lg overflow-hidden"
                        style={{
                            aspectRatio: selectedVariant
                                ? `${IMAGE_VARIANTS[selectedVariant.type].dimensions.width} / ${IMAGE_VARIANTS[selectedVariant.type].dimensions.height}`
                                : "1 / 1",
                        }}
                    >
                        <Image
                            urlEndpoint={process.env.NEXT_PUBLIC_URL_ENDPOINT}
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            transformation={
                                selectedVariant
                                    ? getTransformation(selectedVariant.type)
                                    : getTransformation("SQUARE")
                            }
                            className="object-cover"
                        />
                    </div>

                    {selectedVariant && (
                        <div className="text-sm text-center text-base-content/70">
                            Preview: {IMAGE_VARIANTS[selectedVariant.type].dimensions.width} x{" "}
                            {IMAGE_VARIANTS[selectedVariant.type].dimensions.height}px
                        </div>
                    )}
                </div>

                {/* Product Details Section */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
                        <p className="text-base-content/80 text-lg">
                            {product.description}
                        </p>
                    </div>

                    {/* Variants Selection */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Available Versions</h2>
                        {product.variants.map((variant) => {
                            const info = IMAGE_VARIANTS[variant.type];
                            return (
                                <div
                                    key={`${variant.type}-${variant.license}`}
                                    className={`card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors ${isSelected(variant) ? "ring-2 ring-primary" : ""
                                        }`}
                                    onClick={() => setSelectedVariant(variant)}
                                >
                                    <div className="card-body p-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <ImageIcon className="w-5 h-5" />
                                                <div>
                                                    <h3 className="font-semibold">{info.label}</h3>
                                                    <p className="text-sm text-base-content/70">
                                                        {info.dimensions.width} x{" "}
                                                        {info.dimensions.height}px •{" "}
                                                        {variant.license} license
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xl font-bold">
                                                    ${variant.price.toFixed(2)}
                                                </span>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePurchase(variant);
                                                    }}
                                                >
                                                    Buy Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* License Information */}
                    <div className="card bg-base-200">
                        <div className="card-body p-4">
                            <h3 className="font-semibold mb-2">License Information</h3>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-success" />
                                    <span>Personal: Use in personal projects</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-success" />
                                    <span>Commercial: Use in commercial projects</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}