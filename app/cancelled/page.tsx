import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle ,CardFooter} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import Link from 'next/link';

function Cancelled(){
  return (
    <div>
        <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Waiting Status</CardTitle>
            <CardDescription>Your reservation has been cancelled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-destructive/10 p-4">
              <h3 className="mb-2 font-semibold text-destructive">Reservation Cancelled</h3>
              <p className="text-sm">
                Your reservation has been cancelled. Please check with the restaurant staff for more information.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Cancelled;