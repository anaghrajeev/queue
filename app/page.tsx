import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-white">Restaurant Management System</h1>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Welcome to our Restaurant Management System
              </h2>
              <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Streamline your restaurant operations with our comprehensive management system.
              </p>
              <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-center">
                <Link href="/check-in">
                  <Button size="lg" className="w-full sm:w-auto">
                    Guest Check-in
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Staff Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-muted px-6 py-4">
        <div className="mx-auto max-w-7xl text-center text-sm">
          &copy; {new Date().getFullYear()} Restaurant Management System. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

