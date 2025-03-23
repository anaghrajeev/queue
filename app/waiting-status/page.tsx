"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, AlertCircle, Router } from 'lucide-react'
import { Provider, useDispatch, useSelector } from "react-redux"
import { RootState } from "../Redux/store/store"
import { fetchCheckIns,deleteCheckIn, subscribeToCheckIns } from "../Redux/slice/checkInSlice"
import { useSearchParams } from "next/navigation"
import store from "../Redux/store/store"
import { useRouter } from "next/navigation"
const WaitingPage =()=>{
  return (
    <Provider store={store}>
      <WaitingStatusPage />
    </Provider>
  )
}
export default WaitingPage

function WaitingStatusPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)
  const [currentCheckIn, setCurrentCheckIn] = useState<any>(null)
  const router = useRouter()
  const dispatch = useDispatch()
  const checkIns = useSelector((state: RootState) => state.checkIn.checkIns)
  const searchParams = useSearchParams()
  const mobileNumber = searchParams.get('mobile')
    // Request notification permission
    const requestNotificationPermission = async () => {
      if (Notification.permission !== "granted") {
        await Notification.requestPermission()
      }
    }
  
    // Show notification
    const showNotification = (title: string, options?: NotificationOptions) => {
      if (Notification.permission === "granted") {
        new Notification(title, options)
      }
    }
  // Calculate wait time - roughly 15 mins per group ahead in queue
  const calculateWaitTime = (position: number) => {
    const groupsAhead = position - 1
    return Math.max(5, groupsAhead * 15) // Minimum 5 minutes, 15 mins per group ahead
  }
  
  // Calculate progress percentage
  const calculateProgress = (position: number, totalGroups: number) => {
    if (totalGroups <= 1) return 100
    const progressValue = 100 - ((position - 1) / totalGroups) * 100
    return Math.min(Math.max(progressValue, 5), 100) // Between 5% and 100%
  }
  
  // Format the check-in time
  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return "--"
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    requestNotificationPermission()

    const fetchData = async () => {
      try {
        setLoading(true)
        await dispatch(fetchCheckIns() as any)
        setLoading(false)
      } catch (err: any) {
        setError(err.message || "Failed to load waiting status")
        setLoading(false)
      }
    }

    fetchData()
    dispatch(subscribeToCheckIns() as any)
  }, [dispatch])

  useEffect(() => {
    if (!loading && checkIns.length > 0 && mobileNumber) {
      const foundCheckIn = checkIns.find(
        (record) => record.mobileNumber === mobileNumber
      )
      
      if (foundCheckIn) {
        setCurrentCheckIn(foundCheckIn)
        if (foundCheckIn.status === "seated") {

          showNotification("Your group has been seated", {
            body: "Enjoy your meal!",
            icon: "/path/to/icon.png"
          })
          if (foundCheckIn.id !== undefined) {
            dispatch(deleteCheckIn(foundCheckIn.id) as any).then(()=>{
              router.push("/seated")
            })
          }
        }
      } else {
        setError("No check-in found with this mobile number")
      }
    } else if (!loading && checkIns.length === 0) {
      setError("No check-ins available")
    } else if (!loading && !mobileNumber) {
      setError("Mobile number not provided")
    }
  }, [checkIns, loading, mobileNumber])
  const handleCancelCheckIn = () => {
    if (currentCheckIn && currentCheckIn.id) {
      dispatch(deleteCheckIn(currentCheckIn.id) as any);
      setIsCancelled(true);
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Clock className="h-12 w-12 animate-pulse text-primary mb-4" />
            <p className="text-lg font-medium">Loading your waiting status...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <Link href="/" className="mt-4">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentCheckIn && currentCheckIn.status === "cancelled" ) {
    return (
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
    )
  }
  if (currentCheckIn && currentCheckIn.status === "seated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Waiting Status</CardTitle>
            <CardDescription>Your group has been seated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-success/10 p-4">
              <h3 className="mb-2 font-semibold text-success">Seated</h3>
              <p className="text-sm">
                Your group has been seated. Enjoy your meal!
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
  // If we have a current check-in
  if (currentCheckIn) {
    const waitTime = calculateWaitTime(currentCheckIn.queuePosition)
    const progress = calculateProgress(currentCheckIn.queuePosition, checkIns.length)
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Waiting Status</CardTitle>
            <CardDescription>
              Your group is in the queue (Position: {currentCheckIn.queuePosition})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Estimated wait time</span>
                <span className="text-sm font-medium">{waitTime} minutes</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h3 className="mb-2 font-semibold">Status</h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">#{currentCheckIn.queuePosition}</span>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Group size: {currentCheckIn.numberOfPeople}
                    {currentCheckIn.hasSeniors && ` (incl. ${currentCheckIn.seniorCount} seniors)`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mobile: {currentCheckIn.mobileNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check-in time: {formatTime(currentCheckIn.checkInTime) || "Recently"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">Table assignment</h3>
              <p className="text-sm text-muted-foreground">
                You will be notified when your table is ready.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              variant="destructive" 
              className="w-full mb-2"
              onClick={handleCancelCheckIn}
            >
              Cancel Check-in
            </Button>
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

  // Fallback - should never reach this if all conditions are handled correctly
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Waiting Status</CardTitle>
          <CardDescription>No check-in information available</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please check-in first or verify your mobile number.</p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Link href="/check-in" className="w-full">
            <Button className="w-full">Go to Check-in</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}