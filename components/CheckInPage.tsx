// Updated CheckInPage.tsx
"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { addCheckInToSupabase, fetchCheckIns, subscribeToCheckIns } from "../app/Redux/slice/checkInSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RootState } from "../app/Redux/store/store";
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Instagram, Star, ExternalLink } from "lucide-react";
import { setLastUpdated } from "../app/Redux/slice/checkInSlice";

export default function CheckInPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const checkIns = useSelector((state: RootState) => state.checkIn.checkIns);
  const lastUpdated = useSelector((state: RootState) => state.checkIn.lastUpdated);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [hasSeniorsChecked, setHasSeniorsChecked] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await dispatch(fetchCheckIns() as any);
        dispatch(subscribeToCheckIns() as any);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    
    initialize();

    return () => {
      // Cleanup if needed
    };
  }, [dispatch]);

  const handleInputs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const form = e.target as HTMLFormElement;
    const mobileNumberCheck = (form.elements.namedItem("mobileNumber") as HTMLInputElement).value;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const groupSize = parseInt((form.elements.namedItem("groupSize") as HTMLInputElement).value);

    // Validation
    if (!name || !mobileNumberCheck || isNaN(groupSize) || groupSize < 1) {
      setError("Please fill all fields correctly");
      setIsSubmitting(false);
      return;
    }

    // Check for duplicate mobile number in waiting status
    const existingCheckIn = checkIns.find(
      checkIn => checkIn.mobileNumber === mobileNumberCheck && checkIn.status === "waiting"
    );

    if (existingCheckIn) {
      setError("This mobile number is already in the waiting list");
      setIsSubmitting(false);
      return;
    }

    try {
      const checkInData = {
        name,
        numberOfPeople: groupSize,
        mobileNumber: mobileNumberCheck,
        hasSeniors: hasSeniorsChecked,
        seniorCount: hasSeniorsChecked ? parseInt((form.elements.namedItem("seniorCount") as HTMLInputElement).value) || 0 : 0,
        isSubmitted: true,
        queuePosition: 0, // Will be set by the backend
        status: "waiting",
      };

      await dispatch(addCheckInToSupabase(checkInData) as any);
      setMobileNumber(mobileNumberCheck);
      setShowSuccessDialog(true);
      form.reset();
      setHasSeniorsChecked(false);
    } catch (err) {
      setError("Failed to process check-in. Please try again.");
      console.error("Check-in error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewStatus = () => {
    router.push(`/waiting-status`);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 p-4 gap-10">
      <Card className="w-full max-w-md shadow-md border-gray-200">
        <div className="flex justify-center -mt-8 mb-2">
          <div className="h-16 w-16 rounded-full bg-white shadow-md border-2 border-green-700 flex items-center justify-center">
            <img 
              src="./greenspoon.png" 
              alt="Restaurant Logo"
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
        </div>
        
        <CardHeader className="space-y-1 text-center pb-2">
          <CardTitle className="text-2xl font-bold text-green-800">Green Spoon</CardTitle>
          <CardDescription>Please provide your group details for check-in</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleInputs}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input 
                id="name" 
                name="name" 
                type="text" 
                placeholder="Enter your name" 
                required 
                className="border-gray-300 focus:border-green-600" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="groupSize">Number of people in your group</Label>
              <Input 
                id="groupSize" 
                name="groupSize" 
                type="number" 
                min="1" 
                placeholder="Enter group size" 
                required 
                className="border-gray-300 focus:border-green-600" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input 
                id="mobileNumber" 
                name="mobileNumber" 
                type="tel" 
                placeholder="Enter your mobile number" 
                required 
                className="border-gray-300 focus:border-green-600" 
                pattern="[0-9]{10}"
                title="Please enter a 10-digit mobile number"
              />
            </div>
            
            <div className="flex flex-col items-start space-x-2">
              <div className="flex p-3 gap-3">
                <Checkbox
                  id="hasSeniors"
                  name="hasSeniors"
                  checked={hasSeniorsChecked}
                  onCheckedChange={(checked) => setHasSeniorsChecked(checked === true)}
                />
                <Label htmlFor="hasSeniors">Are there any senior citizens in your group?</Label>
              </div>
              
              {hasSeniorsChecked && (
                <div className="space-y-2 w-full">
                  <Label htmlFor="seniorCount">Number of senior citizens</Label>
                  <Input 
                    id="seniorCount" 
                    name="seniorCount" 
                    type="number" 
                    min="0" 
                    max="10"
                    placeholder="Enter number of seniors" 
                    className="border-gray-300 focus:border-green-600" 
                  />
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-green-700 hover:bg-green-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Check In"}
            </Button>
            <div className="text-center text-sm">
              <Link href="/" className="text-green-700 hover:text-green-800 underline">
                Back to home
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-green-800 text-center">Check-in Successful!</DialogTitle>
            <DialogDescription className="text-center">
              Your group has been added to the waiting list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 text-center">
            <p className="mb-4">
              You can check your waiting status at any time using your mobile number.
            </p>
            
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
                href="https://www.google.com/search?q=Green+Spoon,+Pure+Veg+Haven" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center text-black hover:text-green-700"
              >
                <Star size={24} />
                <span className="text-xs mt-1">Review Us</span>
              </a>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              className="w-full bg-green-700 hover:bg-green-800" 
              onClick={handleViewStatus}
            >
              View Waiting Status
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-gray-300 text-black" 
              onClick={() => setShowSuccessDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="absolute bottom-0 left-0 w-full p-3 text-center text-gray-600 text-xs border-t border-gray-200 bg-white">
        <p>
          © 2025 GreenSpoon.{" "}
          <a 
            href="https://www.instagram.com/greenspoon_kochi?igsh=NWV5d3VsaDZybGN3" 
            className="text-green-700 hover:underline"
          >
            Follow us on Instagram
          </a>{" "}
          •{" "}
          <a 
            href="https://www.google.com/search?q=Green+Spoon,+Pure+Veg+Haven" 
            className="text-green-700 hover:underline"
          >
            Leave a review
          </a>
        </p>
      </div>
    </div>
  );
}