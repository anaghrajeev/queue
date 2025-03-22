"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { addCheckInToSupabase, fetchCheckIns } from "../Redux/slice/checkInSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RootState } from "../Redux/store/store";
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

export default function CheckInPage() {
  const dispatch = useDispatch();
  const checkIns = useSelector((state: RootState) => state.checkIn.checkIns);
  const router = useRouter();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newCheckInMobile, setNewCheckInMobile] = useState("");
  const isoTimestamp = new Date().toISOString(); 

  useEffect(() => {
    // Fetch data from Supabase on startup (once)
    dispatch(fetchCheckIns() as any);
  }, []);
  
  const handleInputs = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const mobileNumberCheck = (form.elements.namedItem("mobileNumber") as HTMLInputElement).value;

    // Check if mobile number already exists
    if (checkIns.some(checkIn => checkIn.mobileNumber === mobileNumberCheck)) {
      return(
        alert("Mobile number already exists")
      )
    }
    const mobileNumber = (form.elements.namedItem("mobileNumber") as HTMLInputElement).value;
    const checkInData = {
      numberOfPeople: parseInt((form.elements.namedItem("groupSize") as HTMLInputElement).value),
      mobileNumber: mobileNumber,
      hasSeniors: (form.elements.namedItem("hasSeniors") as HTMLInputElement).checked,
      seniorCount: parseInt((form.elements.namedItem("seniorCount") as HTMLInputElement).value) || 0,
      isSubmitted: true,
      queuePosition: 0,
      status:"waiting",
      assignedTableId:0,
      seatedTime:isoTimestamp // This will be set in the thunk    };
    };  

    dispatch(addCheckInToSupabase(checkInData) as any);
    
    // Store the mobile number for the success dialog
    setNewCheckInMobile(mobileNumber);
    
    // Show success dialog
    setTimeout(() => {
      setShowSuccessDialog(true);
      // Refetch to get the updated list with queue positions
      dispatch(fetchCheckIns() as any);
    }, 500);
    
    form.reset();
  };

  const handleViewStatus = () => {
    router.push(`/waiting-status?mobile=${encodeURIComponent(newCheckInMobile)}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Guest Check-in</CardTitle>
          <CardDescription>Please provide your group details</CardDescription>
        </CardHeader>
        <form onSubmit={handleInputs}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupSize">Number of people in your group</Label>
              <Input id="groupSize" name="groupSize" type="number" min="1" placeholder="Enter group size" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input id="mobileNumber" name="mobileNumber" type="tel" placeholder="Enter your mobile number" required />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="hasSeniors" name="hasSeniors" />
              <Label htmlFor="hasSeniors">Are there any senior citizens in your group?</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seniorCount">Number of senior citizens</Label>
              <Input id="seniorCount" name="seniorCount" type="number" min="0" placeholder="Enter number of seniors" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">Check In</Button>
            <div className="text-center text-sm">
              <Link href="/" className="text-primary underline">Back to home</Link>
            </div>
          </CardFooter>
        </form>

        {/* Display the check-in list */}
        <CardContent>
          <h2 className="text-lg font-semibold mb-3">Check-In List</h2>
          {checkIns.length === 0 ? (
            <p>No check-ins yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {checkIns.map((checkIn, index) => (
                <li key={index} className="border p-3 rounded-md">
                  <div className="bg-primary text-primary-foreground inline-block px-2 py-1 rounded mb-2">
                    Queue Position: {checkIn.queuePosition}
                  </div>
                  <p><strong>Group Size:</strong> {checkIn.numberOfPeople}</p>
                  <p><strong>Mobile:</strong> {checkIn.mobileNumber}</p>
                  <p><strong>Has Seniors:</strong> {checkIn.hasSeniors ? "Yes" : "No"}</p>
                  {checkIn.hasSeniors && <p><strong>Senior Count:</strong> {checkIn.seniorCount}</p>}
                  <div className="mt-2">
                    <Link href={`/waiting-status?mobile=${encodeURIComponent(checkIn.mobileNumber)}`}>
                      <Button variant="outline" size="sm">View Status</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in Successful!</DialogTitle>
            <DialogDescription>
              Your group has been added to the waiting list.
            </DialogDescription>
          </DialogHeader>
          <p>
            You can check your waiting status at any time using your mobile number.
          </p>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button className="w-full" onClick={handleViewStatus}>
              View Waiting Status
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}