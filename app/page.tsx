"use client"
import { apiClient } from "@/lib/api-client";
import { IProduct } from "@/models/product.model";
import { useEffect, useState } from "react";

export default function Home() {
  const [product, setProduct] = useState<IProduct[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiClient.getProducts()
        console.log(data)
      } catch (error) {

      }
    }

    fetchProducts()
  }, [])
  return (
    <div>
      Hello from Home Screen
    </div>
  );
}
