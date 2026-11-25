"use client"
import { IProduct } from "@/models/product.model";
import { useEffect, useState } from "react";

export default function Home() {
  const [product, setProduct] = useState<IProduct[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await fetch("api/products")
        const result = await data.json()
        console.log(result)
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
