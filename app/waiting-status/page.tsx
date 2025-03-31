"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { Provider, useDispatch, useSelector } from "react-redux"
import { RootState } from "../Redux/store/store"
import { fetchCheckIns, subscribeToCheckIns, deleteCheckIn } from "../Redux/slice/checkInSlice"
import store from "../Redux/store/store"
import TableAllocation from "../../components/TableAllocation"
import { useToast } from "@/components/ui/use-toast"

const QueueManagementPage = () => {
  return (
    <Provider store={store}>
      <SimplifiedQueueDashboard />
    </Provider>
  )
}
export default QueueManagementPage

function SimplifiedQueueDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSeatedIndex, setCurrentSeatedIndex] = useState(0);
  const dispatch = useDispatch();
  const checkIns = useSelector((state: RootState) => state.checkIn.checkIns);
  const lastUpdated = useSelector((state: RootState) => state.checkIn.lastUpdated);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await dispatch(fetchCheckIns() as any);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load queue data");
        setLoading(false);
      }
    };
    
    fetchData();
    const subscription = dispatch(subscribeToCheckIns() as any);
    
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [dispatch]);

  // Reset current index when check-ins array changes
  useEffect(() => {
    setCurrentSeatedIndex(0);
  }, [checkIns.length]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await dispatch(fetchCheckIns() as any);
      toast({
        title: "Queue refreshed",
        description: "The queue data has been updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh queue data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Find seated check-ins with an assigned table ID
  const seatedCheckIns = checkIns.filter(checkIn => 
    checkIn.status === "seated" && checkIn.assignedTableId
  );
  
  // Filter for waiting check-ins
  const waitingCheckIns = checkIns.filter(
    (checkIn) => checkIn.status !== "seated"
  );

  // Handle when a ticket is closed
  const handleTicketClose = (checkInId: number | string) => {
    // Remove the check-in from the store
    if (typeof checkInId === "number") {
      dispatch(deleteCheckIn(checkInId) as any);
    } else {
      console.error("Invalid checkInId: Expected a number.");
    }
    
    // Move to the next seated check-in if available
    if (currentSeatedIndex < seatedCheckIns.length - 1) {
      setCurrentSeatedIndex(prev => prev + 1);
    } else {
      // If we've shown all seated check-ins, reset the index
      setCurrentSeatedIndex(0);
    }

    toast({
      title: "Check-in processed",
      description: "The customer has been notified of their table.",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Clock className="h-12 w-12 animate-pulse text-primary mb-4" />
            <p className="text-lg font-medium">Loading queue data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <Button variant="outline" className="mt-4" onClick={handleRefresh}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <img 
            src="./greenspoon.png" 
            alt="Restaurant Logo"
            className="h-10 w-10 rounded-full border border-green-700" 
          />
          <h1 className="text-2xl font-bold">Queue Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
          </span>
          <Button onClick={handleRefresh} size="sm" className="flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {seatedCheckIns.length > 0 && (
        <Card className="mb-6 border-green-600 border-2">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center justify-between">
              <span>Seated Customers ({seatedCheckIns.length})</span>
              {seatedCheckIns.length > 1 && (
                <span className="text-sm font-normal">
                  Showing {currentSeatedIndex + 1} of {seatedCheckIns.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Guest</p>
                <p className="text-lg font-bold">{seatedCheckIns[currentSeatedIndex]?.name || "Guest"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Table</p>
                <p className="text-lg font-bold">{seatedCheckIns[currentSeatedIndex]?.assignedTableId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Group Size</p>
                <p className="text-lg font-bold">{seatedCheckIns[currentSeatedIndex]?.numberOfPeople || 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Queue ({waitingCheckIns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Group Size</TableHead>
                <TableHead>Seniors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waitingCheckIns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Queue is empty
                  </TableCell>
                </TableRow>
              ) : (
                waitingCheckIns.map((checkIn) => (
                  <TableRow key={checkIn.id}>
                    <TableCell>#{checkIn.queuePosition}</TableCell>
                    <TableCell>{checkIn.name || "Guest"}</TableCell>
                    <TableCell>{checkIn.numberOfPeople}</TableCell>
                    <TableCell>{checkIn.hasSeniors ? `Yes (${checkIn.seniorCount})` : 'No'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Display current seated check-in allocation */}
      {seatedCheckIns.length > 0 && seatedCheckIns[currentSeatedIndex]?.id !== undefined && (
        <TableAllocation
          checkInId={seatedCheckIns[currentSeatedIndex]?.id}
          userName={seatedCheckIns[currentSeatedIndex]?.name || "Guest"}
          assignedTableId={seatedCheckIns[currentSeatedIndex]?.assignedTableId || ""}
          currentIndex={currentSeatedIndex}
          totalSeated={seatedCheckIns.length}
          onClose={() => {
            const checkInId = seatedCheckIns[currentSeatedIndex]?.id;
            if (checkInId !== undefined) {
              handleTicketClose(checkInId);
            }
          }}
        />
      )}
    </div>
  );
}