"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2 } from "lucide-react"

export default function WaitingStatusPage() {
  const searchParams = useSearchParams()
  const groupSize = searchParams.get("id") || "2"
  const [waitTime, setWaitTime] = useState<number>(0)
  const [maxWaitTime, setMaxWaitTime] = useState<number>(30)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [isSeated, setIsSeated] = useState<boolean>(false)
  const [assignedTable, setAssignedTable] = useState<number | null>(null)
  const [seatedTime, setSeatedTime] = useState<string | null>(null)

  useEffect(() => {
    // Simulate real-time updates
    const size = Number.parseInt(groupSize)
    const baseWaitTime = 10 // minutes
    const estimatedWaitTime = baseWaitTime + (size > 4 ? 15 : 5)
    setMaxWaitTime(estimatedWaitTime)

    const getStatus = async () => {
      try {
        const response = await fetch("/api/waiting", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch waiting queue")
        }

        const data = await response.json()
        
        // Check if the group is in waiting list
        if (data.waitingGroups && Array.isArray(data.waitingGroups)) {
          setQueuePosition(data.waitingGroups.length)
        }

        // Check if the group has been seated
        if (data.tables && Array.isArray(data.tables)) {
          const engagedTable = data.tables.find(
            (table: any) => table.status === "engaged" && table.groupSize === Number(groupSize)
          )
          
          if (engagedTable) {
            setIsSeated(true)
            setAssignedTable(engagedTable.number)
            setSeatedTime(engagedTable.occupiedAt)
            setQueuePosition(null)
          }
        }
      } catch (error) {
        console.error("Error fetching status:", error)
      }
    }

    getStatus()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(getStatus, 30000)

    // Update wait time progress
    const timeInterval = setInterval(() => {
      if (!isSeated) {
        setWaitTime((prev) => {
          const newValue = prev + 1
          if (newValue >= estimatedWaitTime) {
            clearInterval(timeInterval)
            return estimatedWaitTime
          }
          return newValue
        })
      }
    }, 10000)

    return () => {
      clearInterval(interval)
      clearInterval(timeInterval)
    }
  }, [groupSize, isSeated])

  const progressPercentage = (waitTime / maxWaitTime) * 100
  const remainingTime = Math.max(0, maxWaitTime - waitTime)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Waiting Status</CardTitle>
          <CardDescription>Your group of {groupSize} {isSeated ? 'has been seated' : 'is in the queue'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSeated && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Estimated wait time</span>
                <span className="text-sm font-medium">{remainingTime} minutes</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <div className="rounded-lg bg-muted p-4">
            <h3 className="mb-2 font-semibold">Status</h3>
            <div className="flex items-center justify-between">
              {isSeated || queuePosition==0? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-lg font-medium">Seated</span>
                </div>
              ) : (
                <span className="text-3xl font-bold">{queuePosition}</span>
              )}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Group size: {groupSize}</p>
                <p className="text-sm text-muted-foreground">
                  {isSeated 
                    ? `Seated at: ${new Date(seatedTime!).toLocaleTimeString()}`
                    : `Check-in time: ${new Date().toLocaleTimeString()}`
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">Table assignment</h3>
            {isSeated || queuePosition==0? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">
                  Your table is ready! Please proceed to Table {assignedTable}.
                </p>
                <p className="text-sm text-muted-foreground">
                  A staff member will assist you shortly.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You will be notified when your table is ready.
              </p>
            )}
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