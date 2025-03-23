"use client"

import { CardFooter } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from "react"

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = form.username.value;
    const password = form.password.value;

    // Hardcoded credentials for simplicity
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
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" placeholder="Enter your username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Enter your password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">Login</Button>
            <div className="text-center text-sm">
              <Link href="/" className="text-primary underline">
                Back to home
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}