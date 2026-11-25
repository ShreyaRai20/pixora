import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProductView from "@/components/ProductView";

export default function ProductPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[70vh] flex justify-center items-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            }
        >
            <ProductView />
        </Suspense>
    );
}