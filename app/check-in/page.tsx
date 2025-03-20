"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

export default function CheckInPage() {
  const [groupSize, setGroupSize] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [hasSeniors, setHasSeniors] = useState(false)
  const [seniorCount, setSeniorCount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [isSeated, setIsSeated] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchQueuePosition = async () => {
      try {
        const response = await fetch("/api/waiting", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        const result = await response.json()

        if (response.ok) {
          setQueuePosition(result.position)
          setIsSeated(result.position === 0) // Mark as seated if position is 0
        }
      } catch (error) {
        console.error("Error fetching queue position:", error)
      }
    }

    fetchQueuePosition()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const checkInData = {
        size: Number.parseInt(groupSize),
        mobileNumber,
        hasSeniors,
        seniorCount: hasSeniors ? Number.parseInt(seniorCount) : 0,
      }

      const response = await fetch("/api/waiting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkInData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to check in")
      }

      toast({
        title: "Check-in successful",
        description: `You've been added to the waiting list (Position: ${result.position})`,
      })

      setQueuePosition(result.position)
      setIsSeated(result.position === 0) // Update state based on new position

      router.push(`/waiting-status?id=${result.group.size}`)
    } catch (error) {
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "An error occurred during check-in",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Guest Check-in</CardTitle>
          <CardDescription>Please provide your group details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupSize">Number of people in your group</Label>
              <Input
                id="groupSize"
                type="number"
                min="1"
                placeholder="Enter group size"
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasSeniors"
                checked={hasSeniors}
                onCheckedChange={(checked) => {
                  setHasSeniors(checked === true)
                  if (!checked) setSeniorCount("")
                }}
              />
              <Label htmlFor="hasSeniors">Are there any senior citizens in your group?</Label>
            </div>
            {hasSeniors && (
              <div className="space-y-2">
                <Label htmlFor="seniorCount">Number of senior citizens</Label>
                <Input
                  id="seniorCount"
                  type="number"
                  min="1"
                  max={groupSize || "1"}
                  placeholder="Enter number of seniors"
                  value={seniorCount}
                  onChange={(e) => setSeniorCount(e.target.value)}
                  required
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Check In"}
            </Button>

            {/* Conditionally show queue position if user is not seated */}
            {!isSeated && queuePosition !== null && (
              <div className="text-center text-sm text-gray-700">
                Your position in the queue: <span className="font-bold">{queuePosition}</span>
              </div>
            )}

            <div className="text-center text-sm">
              <Link href="/" className="text-primary underline">
                Back to home
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

