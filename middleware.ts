import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware() {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Auth pages and NextAuth's own endpoints are always accessible
                if (
                    pathname.startsWith("/api/auth") ||
                    pathname === "/login" ||
                    pathname === "/register"
                ) {
                    return true;
                }

                // Public routes
                if (
                    pathname === "/" ||
                    pathname.startsWith("/api/products") ||
                    pathname.startsWith("/products")
                ) {
                    return true;
                }

                // Admin routes require admin role
                if (pathname.startsWith("/admin")) {
                    return token?.role === "admin";
                }

                // Everything else requires authentication
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};