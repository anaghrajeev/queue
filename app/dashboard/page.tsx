"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Provider, useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, Users, Clock, CheckSquare, ArrowUp, ArrowDown } from "lucide-react"
import store from "../Redux/store/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toast } from "@/components/ui/toast"
import { fetchTables, updateTable, TableState, TableStatus,subscribeToTables, } from "../Redux/slice/tableSlice"
import { fetchCheckIns, clearCheckIns,updateCheckInPosition,updateCheckInStatus, deleteCheckIn,subscribeToCheckIns } from "../Redux/slice/checkInSlice"

// Extend the CheckInState to include an id field for management
interface CheckInState {
  id?: number
  numberOfPeople: number
  mobileNumber: string
  hasSeniors: boolean
  seniorCount: number
  isSubmitted: boolean
  queuePosition: number
  status?: "waiting" | "seated" | "cancelled"
  assignedTableId?: number
  seatedTime?: string
}

export default function Dashboard() {
  return(
    <Provider store={store}>
      <DashboardPage />
    </Provider>
  )
}
 function DashboardPage() {
  const dispatch = useDispatch()
  
  // Get tables and check-ins from Redux store
  const tables = useSelector((state: any) => state.tables.tables)
  const checkIns = useSelector((state: any) => state.checkIn.checkIns)
  const loading = useSelector((state: any) => state.tables.loading)
  
  // UI state
  const [showWaitTimeDialog, setShowWaitTimeDialog] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableState | null>(null)
  const [customWaitTime, setCustomWaitTime] = useState<string>("15")
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckInState | null>(null)
  const [showSeatDialog, setShowSeatDialog] = useState(false)
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);
  
  // Fetch tables and check-ins on component mount
  useEffect(() => {
    
    dispatch(fetchTables() as any)
    dispatch(fetchCheckIns() as any)
    dispatch(subscribeToTables() as any)
    dispatch(subscribeToCheckIns() as any)
  }, [dispatch])

  // Filter active waiting check-ins
  const activeWaitingGroups = checkIns.filter(
    (checkIn: CheckInState) => checkIn.status !== "seated" && checkIn.status !== "cancelled"
  )

  // Get available tables
  const availableTables = tables.filter((table: TableState) => table.status === TableStatus.free)
  
  // Get occupied tables
  const occupiedTables = tables.filter((table: TableState) => table.status === TableStatus.engaged)

  // Get status badge color
  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case TableStatus.free:
        return <Badge className="bg-green-500">Free</Badge>
      case TableStatus.engaged:
        return <Badge className="bg-red-500">Engaged</Badge>
      case TableStatus.cleaning:
        return <Badge className="bg-yellow-500">Cleaning</Badge>
    }
  }

  // Calculate time elapsed since table was occupied
  const getTimeElapsed = (occupiedAt?: string | null) => {
    if (!occupiedAt) return "N/A"
    
    const occupiedTime = new Date(occupiedAt).getTime()
    const currentTime = new Date().getTime()
    const elapsedMinutes = Math.floor((currentTime - occupiedTime) / (1000 * 60))
    
    // Format as hours and minutes if more than 60 minutes
    if (elapsedMinutes >= 60) {
      const hours = Math.floor(elapsedMinutes / 60)
      const minutes = elapsedMinutes % 60
      return `${hours}h ${minutes}m`
    }
    
    return `${elapsedMinutes}m`
  }
  
  // Format time in 12-hour format with AM/PM
  const formatTime = (timestamp: string = "" ) => {
    const [hours, minutes] = timestamp.split(":"); // Extract hours and minutes
    return new Date(0, 0, 0, parseInt(hours), parseInt(minutes)).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  // Set table status
  const changeTableStatus = (table: TableState, newStatus: TableStatus) => {
    const updatedTable = { ...table, status: newStatus }
    
    // Set engaged time if status is engaged
    if (newStatus === TableStatus.engaged && table.status !== TableStatus.engaged) {
      updatedTable.engagedTime = new Date().toISOString()
    }
    
    // Set cleaning time if status is cleaning
    if (newStatus === TableStatus.cleaning && table.status !== TableStatus.cleaning) {
      updatedTable.cleaningTime = new Date().toISOString()
      
      // Set a timer to automatically change to free after 1 minute
      setTimeout(() => {
        dispatch(
          updateTable({
            ...updatedTable,
            status: TableStatus.free,
            cleaningTime: null,
          }) as any
        )
       
      }, 60000) // 1 minute
    }
    
    // Reset times if status is free
    if (newStatus === TableStatus.free) {
      updatedTable.engagedTime = null
      updatedTable.cleaningTime = null
    }
    
    dispatch(updateTable(updatedTable) as any)
    
  }

  // Set wait time for a table
  const setWaitTime = () => {
    if (!selectedTable) return
    
    const updatedTable = {
      ...selectedTable,
      estimatedWaitTime: parseInt(customWaitTime),
    }
    
    dispatch(updateTable(updatedTable) as any)
    setShowWaitTimeDialog(false)
    
  }

  // Move check-in up in queue
  const moveCheckInUp = (checkIn: CheckInState) => {
    if (checkIn.queuePosition <= 1) return
    
    const checkInAbove = checkIns.find((ci: CheckInState) => ci.queuePosition === checkIn.queuePosition - 1)
    
    if (checkInAbove) {
      dispatch(
        updateCheckInPosition({
          id: checkIn.id,
          queuePosition: checkIn.queuePosition - 1,
        }) as any
      )
      
      dispatch(
        updateCheckInPosition({
          id: checkInAbove.id,
          queuePosition: checkInAbove.queuePosition + 1,
        }) as any
      )
    }
  }

  // Move check-in down in queue
  const moveCheckInDown = (checkIn: CheckInState) => {
    const checkInBelow = checkIns.find((ci: CheckInState) => ci.queuePosition === checkIn.queuePosition + 1)
    
    if (checkInBelow) {
      dispatch(
        updateCheckInPosition({
          id: checkIn.id,
          queuePosition: checkIn.queuePosition + 1,
        }) as any
      )
      
      dispatch(
        updateCheckInPosition({
          id: checkInBelow.id,
          queuePosition: checkInBelow.queuePosition - 1,
        }) as any
      )
    }
  }

  // Remove check-in from queue
  const removeCheckIn = (checkIn: CheckInState) => {

    dispatch(
      updateCheckInStatus({
        id: checkIn.id,
        status: "cancelled",
      }) as any
    )

    //dispatch delete
    dispatch(
      deleteCheckIn(checkIn.id as number) as any
    )
}

  // Open seat dialog
  const openSeatDialog = (checkIn: CheckInState) => {
    setSelectedCheckIn(checkIn)
    setShowSeatDialog(true)
  }

  // Seat check-in at a table
  const seatCheckIn = (tableId: number) => {
    if (!selectedCheckIn) return
    
    const table = tables.find((t: TableState) => t.tableId === tableId)
    
    if (!table) return
    
    // Update check-in status
    dispatch(
      updateCheckInStatus({
        id: selectedCheckIn.id,
        status: "seated",
        assignedTableId: tableId,
        seatedTime: new Date().toISOString(),
      }) as any
    )
    
    // Update table status
    dispatch(
      updateTable({
        ...table,
        status: TableStatus.engaged,
        engagedTime: new Date().toISOString(),
      }) as any
    )
    setShowSeatDialog(false)
   
  }

 
  // Filter suitable tables for a group
  const getSuitableTables = (groupSize: number) => {

    return availableTables.filter((table: TableState) => table.capacity >= groupSize)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-primary px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Waiter Dashboard</h1>
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Available Tables</CardTitle>
                <CardDescription>Tables ready for seating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{availableTables.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Occupied Tables</CardTitle>
                <CardDescription>Currently in use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{occupiedTables.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Waiting Groups</CardTitle>
                <CardDescription>Groups in queue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeWaitingGroups.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tables">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tables" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Table Management
              </TabsTrigger>
              <TabsTrigger value="waiting" className="gap-2">
                <Users className="h-4 w-4" />
                Waiting List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tables" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tables</CardTitle>
                  <CardDescription>Manage restaurant tables</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {tables.map((table: TableState) => (
                        <Card key={table.tableId} className="overflow-hidden">
                          <CardHeader className="bg-muted p-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">Table {table.tableNumber}</CardTitle>
                              {getStatusBadge(table.status)}
                            </div>
                            <CardDescription>Capacity: {table.capacity} people</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4">
                            {table.status === TableStatus.engaged && (
                              <div className="mb-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Occupied for: {getTimeElapsed(table.engagedTime)}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedTable(table)
                                      setShowWaitTimeDialog(true)
                                    }}
                                  >
                                    Set wait time
                                  </Button>
                                </div>
                                {table.engagedTime && (
                                  <div className="text-sm text-muted-foreground">
                                    Estimated wait: {formatTime(table.engagedTime)} minutes
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {table.status !== TableStatus.free && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => changeTableStatus(table, TableStatus.free)}
                                >
                                  Mark Free
                                </Button>
                              )}

                              {table.status !== TableStatus.engaged && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => changeTableStatus(table, TableStatus.engaged)}
                                >
                                  Mark Engaged
                                </Button>
                              )}

                              {table.status !== TableStatus.cleaning && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => changeTableStatus(table, TableStatus.cleaning)}
                                >
                                  Mark Cleaning
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="waiting" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Waiting List</CardTitle>
                  <CardDescription>Manage waiting guests</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : activeWaitingGroups.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <h3 className="mb-2 text-lg font-semibold">No waiting groups</h3>
                      <p className="text-sm text-muted-foreground">All guests have been seated</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeWaitingGroups
                        .sort((a: CheckInState, b: CheckInState) => a.queuePosition - b.queuePosition)
                        .map((group: CheckInState, index: number) => (
                          <Card key={group.id} className={group.hasSeniors ? "border-l-4 border-l-amber-500" : ""}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">Group #{group.queuePosition}</h3>
                                    {group.hasSeniors && (
                                      <Badge className="bg-amber-500">Seniors: {group.seniorCount}</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Size: {group.numberOfPeople} people
                                  </p>
                                  <p className="text-sm text-muted-foreground">Mobile: {group.mobileNumber}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Waiting since: {formatTime(group.seatedTime ?? "")}
                                  </p>
                                  <p className="text-sm text-muted-foreground">Senior Count:{group.seniorCount}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => removeCheckIn(group)}
                                    >
                                      Remove
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => openSeatDialog(group)}
                                      disabled={getSuitableTables(group.numberOfPeople).length === 0}
                                    >
                                      Seat Now
                                    </Button>
                                  </div>
                                  <div className="flex justify-end gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => moveCheckInUp(group)}
                                      disabled={group.queuePosition <= 1}
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => moveCheckInDown(group)}
                                      disabled={group.queuePosition >= activeWaitingGroups.length}
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Wait Time Dialog */}
      <Dialog open={showWaitTimeDialog} onOpenChange={setShowWaitTimeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Estimated Wait Time</DialogTitle>
            <DialogDescription>Set the estimated wait time for Table {selectedTable?.tableNumber}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="wait-time">Wait time (minutes)</Label>
              <Input
                id="wait-time"
                type="number"
                value={customWaitTime}
                onChange={(e) => setCustomWaitTime(e.target.value)}
                min="5"
                max="120"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={setWaitTime}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seat Customer Dialog */}
      <Dialog open={showSeatDialog} onOpenChange={setShowSeatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seat Group #{selectedCheckIn?.queuePosition}</DialogTitle>
            <DialogDescription>
              Select a table for group of {selectedCheckIn?.numberOfPeople} people
              {selectedCheckIn?.hasSeniors ? ` (includes ${selectedCheckIn.seniorCount} seniors)` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="max-h-60 overflow-y-auto">
              {getSuitableTables(selectedCheckIn?.numberOfPeople ?? 0).length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">No suitable tables available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getSuitableTables(selectedCheckIn?.numberOfPeople ?? 0).map((table: TableState) => (
                    <Button
                      key={table.tableId}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => seatCheckIn(table.tableId)}
                    >
                      <span>Table {table.tableNumber}</span>
                      <span className="text-sm text-muted-foreground">
                        Capacity: {table.capacity}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSeatDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
   
    </div>
  )
}