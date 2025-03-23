"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = form.username.value;
    const password = form.password.value;

    const adminCredentials = { username: "admin", password: "admin123" };
    const waiterCredentials = { username: "waiter", password: "waiter123" };

    if (username === adminCredentials.username && password === adminCredentials.password) {
      router.push("/admin/dashboard");
    } else if (username === waiterCredentials.username && password === waiterCredentials.password) {
      router.push("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <Card className="w-full max-w-md rounded-lg shadow-lg border border-gray-300 bg-white">
        {/* Header with Logo */}
        <CardHeader className="flex flex-col items-center space-y-3 text-center">
          <div className="relative w-16 h-16">
            <Image src="/greenspoon.png" alt="Company Logo" layout="fill" objectFit="contain" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">Table Status</CardTitle>
          <CardDescription className="text-gray-600">Your party has been seated and is ready to dine</CardDescription>
        </CardHeader>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">Username</Label>
              <Input id="username" name="username" type="text" placeholder="Enter your username" required className="rounded-md border-gray-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Enter your password" required className="rounded-md border-gray-300" />
            </div>
          </CardContent>

          {/* Login Button */}
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md">
              Login
            </Button>
            <div className="text-center text-sm text-gray-600">
              <Link href="/" className="text-blue-600 hover:underline">
                Back to home
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
