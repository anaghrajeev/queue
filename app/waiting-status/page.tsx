"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function WaitingStatusPage() {
  const searchParams = useSearchParams()
  const groupSize = searchParams.get("group") || "2"
  const [waitTime, setWaitTime] = useState<number>(0)
  const [maxWaitTime, setMaxWaitTime] = useState<number>(30)
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

   
  useEffect(() => {
    // Simulate real-time updates
    // In a real app, this would be connected to Firebase or another real-time database
    const size = Number.parseInt(groupSize)

    // Calculate estimated wait time based on group size
    // This is just a simple simulation
    const baseWaitTime = 10 // minutes

    const estimatedWaitTime = baseWaitTime + (size > 4 ? 15 : 5)

    setMaxWaitTime(estimatedWaitTime)
    const getPosition = async () => {
      try {
        const response = await fetch("/api/waiting", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          throw new Error("Failed to fetch waiting queue");
        }
  
        const data = await response.json();
        if (data.waitingGroups && Array.isArray(data.waitingGroups)) {
          setQueuePosition(data.waitingGroups.length);
        }
      } catch (error) {
        console.error("Error fetching queue position:", error);
      }
    };
  
    getPosition();
    // Simulate decreasing wait time
    const interval = setInterval(() => {
      setWaitTime((prev) => {
        const newValue = prev + 1
        if (newValue >= estimatedWaitTime) {
          clearInterval(interval)
          return estimatedWaitTime
        }
        return newValue
      })
    }, 10000) // Update every second for demo purposes

    return () => clearInterval(interval)
  }, [groupSize])

  const progressPercentage = (waitTime / maxWaitTime) * 100
  const remainingTime = Math.max(0, maxWaitTime - waitTime)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Waiting Status</CardTitle>
          <CardDescription>Your group of {groupSize} is in the queue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Estimated wait time</span>
              <span className="text-sm font-medium">{remainingTime} minutes</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h3 className="mb-2 font-semibold">Your position</h3>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{queuePosition}</span>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Group size: {groupSize}</p>
                <p className="text-sm text-muted-foreground">Check-in time: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">Table assignment</h3>
            <p className="text-sm text-muted-foreground">
              {remainingTime <= 0
                ? "Your table is ready! Please proceed to the host stand."
                : "You will be notified when your table is ready."}
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
  )
}

