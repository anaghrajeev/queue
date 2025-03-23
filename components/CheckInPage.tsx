"use client"
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { addCheckInToSupabase, fetchCheckIns } from "../app/Redux/slice/checkInSlice";
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

export default function CheckInPage() {
  const dispatch = useDispatch();
  const checkIns = useSelector((state: RootState) => state.checkIn.checkIns);
  const router = useRouter();
  const [newCheckInMobile, setNewCheckInMobile] = useState("");
  const isoTimestamp = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [hasSeniorsChecked, setHasSeniorsChecked] = useState(false);

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
        mobileNumber: mobileNumberCheck,
        hasSeniors: hasSeniorsChecked,
        seniorCount: hasSeniorsChecked ? parseInt((form.elements.namedItem("seniorCount") as HTMLInputElement).value) || 0 : 0,
        isSubmitted: true,
        queuePosition: 0,
        status: "waiting",
        assignedTableId: 0,
        seatedTime: isoTimestamp.toString(),
      }; 

    dispatch(addCheckInToSupabase(checkInData) as any);
    
    // Store the mobile number for the success dialog
    setNewCheckInMobile(mobileNumber);
    
    // Show success dialog
    setShowSuccessDialog(true);
    form.reset();
  };

  const handleViewStatus = () => {
    router.push(`/waiting-status?mobile=${encodeURIComponent(newCheckInMobile)}`);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 p-4 gap-10">
     
      
      <Card className="w-full max-w-md shadow-md border-gray-200">
        {/* Logo centered on card */}
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
            <div className="space-y-2">
              <Label htmlFor="groupSize">Number of people in your group</Label>
              <Input id="groupSize" name="groupSize" type="number" min="1" placeholder="Enter group size" required className="border-gray-300 focus:border-green-600" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input id="mobileNumber" name="mobileNumber" type="tel" placeholder="Enter your mobile number" required className="border-gray-300 focus:border-green-600" />
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
      <div className="space-y-2 ">
        <Label htmlFor="seniorCount">Number of senior citizens</Label>
        <Input id="seniorCount" name="seniorCount" type="number" min="0" placeholder="Enter number of seniors" className="border-gray-300 focus:border-green-600" />
      </div>
    )}
            </div>
           
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-green-700 hover:bg-green-800">Check In</Button>
            <div className="text-center text-sm">
              <Link href="/" className="text-green-700 hover:text-green-800 underline">Back to home</Link>
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
            
            {/* Social media and review prompts */}
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
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button className="w-full bg-green-700 hover:bg-green-800" onClick={handleViewStatus}>
              View Waiting Status
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-black" onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Footer branding - simplified */}
      <div className="absolute bottom-0 left-0 w-full p-3 text-center text-gray-600 text-xs border-t border-gray-200 bg-white">
        <p>© 2025GreenSpoon. <a href="https://www.instagram.com/greenspoon_kochi?igsh=NWV5d3VsaDZybGN3" className="text-green-700 hover:underline">Follow us on Instagram</a> • <a href="https://www.google.com/search?q=Green+Spoon,+Pure+Veg+Haven&sca_esv=6455b9a1373b2beb&hl=en-IN&prmd=imsvn&sxsrf=AHTn8zrI7pxHkR_EJGF6vLlzGv1wTBq31Q:1742760083274&si=APYL9bs7Hg2KMLB-4tSoTdxuOx8BdRvHbByC_AuVpNyh0x2KzROmwwNfmaeMWSZ7cGhrUhUFfL0SCAbTo202gkbbTFGFk_2879atiQ-AqgI2om2AqKuDqAU%3D&sa=X&ved=2ahUKEwivz8Sd_6CMAxUmsFYBHbpUEfoQ9qsLegQIFBAG&biw=411&bih=809&dpr=2.63" className="text-green-700 hover:underline">Leave a review</a></p>
      </div>
    </div>
  );
}