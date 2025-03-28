"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Instagram, Star, ExternalLink } from "lucide-react";

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
  const [showExitDialog, setShowExitDialog] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const checkIns = useSelector((state: RootState) => state.checkIn.checkIns)
  const searchParams = useSearchParams()
  const mobileNumber = searchParams.get('mobile')
    // Request notification permission
    // const requestNotificationPermission = async () => {
    //   if (Notification.permission !== "granted") {
    //     await Notification.requestPermission()
    //   }
    // }
  
    // // Show notification
    // const showNotification = (title: string, options?: NotificationOptions) => {
    //   if (Notification.permission === "granted") {
    //     new Notification(title, options)
    //   }
    // }
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
  useEffect(() => {
    // Prevent accidental page exit
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    // Handle browser back button or swipe navigation
    const handlePopState = (e: PopStateEvent) => {
      setShowExitDialog(true)
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])
 

  const handleForceExit = () => {
    // Remove check-in and navigate away
    if (currentCheckIn && currentCheckIn.id) {
      dispatch(deleteCheckIn(currentCheckIn.id) as any);
    }
    router.push("/");
  };

  const handleStayInQueue = () => {
    setShowExitDialog(false)
  };
  // Format the check-in time
  const formatTime = (timestamp: string | undefined) => {

    return  new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  useEffect(() => {
   // requestNotificationPermission()

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
          // showNotification("Your group has been seated", {
          //   body: "Enjoy your meal!",
          //   icon: "/path/to/icon.png"
          // })
          if (foundCheckIn.id !== undefined) {
            dispatch(deleteCheckIn(foundCheckIn.id) as any).then(()=>{
              router.push("/seated")
            })
          }
        }else if(foundCheckIn.status === "cancelled"){
          if (foundCheckIn.id !== undefined) {
            dispatch(deleteCheckIn(foundCheckIn.id) as any)
            .then(()=>{
              router.push("/cancelled")
            })
          }
        }
      } else {
        setLoading(true)
        
        setLoading(false)
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
    }
    router.push("/");

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
            {/* <Link href="/" className="mt-4">
              <Button variant="outline">Return to Home</Button>
            </Link> */}
          </CardContent>
        </Card>
      </div>
    )
  }

  // if (currentCheckIn && currentCheckIn.status === "cancelled" ) {
   
  //   return (
  //     <div className="flex min-h-screen items-center justify-center bg-muted p-4">
  //       <Card className="w-full max-w-md">
  //         <CardHeader className="space-y-1">
  //           <CardTitle className="text-2xl font-bold">Waiting Status</CardTitle>
  //           <CardDescription>Your reservation has been cancelled</CardDescription>
  //         </CardHeader>
  //         <CardContent className="space-y-6">
  //           <div className="rounded-lg bg-destructive/10 p-4">
  //             <h3 className="mb-2 font-semibold text-destructive">Reservation Cancelled</h3>
  //             <p className="text-sm">
  //               Your reservation has been cancelled. Please check with the restaurant staff for more information.
  //             </p>
  //           </div>
  //         </CardContent>
  //         <CardFooter className="flex flex-col space-y-4">
  //           <Link href="/" className="w-full">
  //             <Button variant="outline" className="w-full">
  //               Return to Home
  //             </Button>
  //           </Link>
  //         </CardFooter>
  //       </Card>
  //     </div>
  //   )
  // }
  // if (currentCheckIn && currentCheckIn.status === "seated") {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center bg-muted p-4">
  //       <Card className="w-full max-w-md">
  //         <CardHeader className="space-y-1">
  //           <CardTitle className="text-2xl font-bold">Waiting Status</CardTitle>
  //           <CardDescription>Your group has been seated</CardDescription>
  //         </CardHeader>
  //         <CardContent className="space-y-6">
  //           <div className="rounded-lg bg-success/10 p-4">
  //             <h3 className="mb-2 font-semibold text-success">Seated</h3>
  //             <p className="text-sm">
  //               Your group has been seated. Enjoy your meal!
  //             </p>
  //           </div>
  //         </CardContent>
  //         <CardFooter className="flex flex-col space-y-4">
  //           <Link href="/" className="w-full">
  //             <Button variant="outline" className="w-full">
  //               Return to Home
  //             </Button>
  //           </Link>
  //         </CardFooter>
  //       </Card>
  //     </div>
  //   )
  // }
  // If we have a current check-in
  if (currentCheckIn) {
    const waitTime = calculateWaitTime(currentCheckIn.queuePosition)
    const progress = calculateProgress(currentCheckIn.queuePosition, checkIns.length)
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4 ">
        <Card className="w-full max-w-md border-2">
        <div className="flex justify-center -mt-8 mb-2">
          <div className="h-16 w-16 rounded-full bg-white shadow-md border-2 border-green-700 flex items-center justify-center">
            <img 
              src="./greenspoon.png" 
              alt="Restaurant Logo"
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
        </div>
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
              <Progress value={progress} className="h-2 " />
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
                <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-100 p-2 rounded-md border border-red-300">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">
                Please don't leave the page. You will be notified when your table is ready.
                  </span>
                </div>
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
            <div className="flex justify-center gap-6 my-4">
              <a 
                href="https://www.instagram.com/greenspoon_kochi?igsh=NWV5d3VsaDZybGN3" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center text-black hover:text-green-700"
              >
                <Instagram size={24} />
                <span className="text-xs mt-1">Follow Us</span>
              </a>
              
              <a 
                href="https://www.google.com/search?q=Green+Spoon,+Pure+Veg+Haven&sca_esv=6455b9a1373b2beb&hl=en-IN&prmd=imsvn&sxsrf=AHTn8zrI7pxHkR_EJGF6vLlzGv1wTBq31Q:1742760083274&si=APYL9bs7Hg2KMLB-4tSoTdxuOx8BdRvHbByC_AuVpNyh0x2KzROmwwNfmaeMWSZ7cGhrUhUFfL0SCAbTo202gkbbTFGFk_2879atiQ-AqgI2om2AqKuDqAU%3D&sa=X&ved=2ahUKEwivz8Sd_6CMAxUmsFYBHbpUEfoQ9qsLegQIFBAG&biw=411&bih=809&dpr=2.63" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center text-black hover:text-green-700"
              >
                <Star size={24} />
                <span className="text-xs mt-1">Review Us</span>
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }
  {showExitDialog && (
    <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Queue?</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave the queue? Your current check-in will be cancelled.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleStayInQueue}>
            Stay in Queue
          </Button>
          <Button variant="destructive" onClick={handleForceExit}>
            Exit Queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )}
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