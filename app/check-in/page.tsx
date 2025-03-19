"use client"

import type React from "react"

import { useState } from "react"
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
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real app, you would send this data to your Firebase backend
      const checkInData = {
        groupSize: Number.parseInt(groupSize),
        mobileNumber,
        hasSeniors,
        seniorCount: hasSeniors ? Number.parseInt(seniorCount) : 0,
        timestamp: new Date().toISOString(),
      }

      console.log("Check-in data:", checkInData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Check-in successful",
        description: "You've been added to the waiting list",
      })

      // Redirect to waiting status page
      router.push(`/waiting-status?group=${groupSize}`)
    } catch (error) {
      toast({
        title: "Check-in failed",
        description: "An error occurred during check-in",
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

