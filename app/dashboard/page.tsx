"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Users, Clock, CheckSquare } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Table status types
type TableStatus = "free" | "engaged" | "cleaning"

// Table interface
interface TableInterface {
  id: number
  number: number
  capacity: number
  status: TableStatus
  occupiedAt?: string
}

// Waiting group interface
interface WaitingGroup {
  id: number
  size: number
  mobileNumber: string
  hasSeniors: boolean
  seniorCount: number
  checkInTime: string
}

export default function DashboardPage() {
  const [tables, setTables] = useState<TableInterface[]>([])
  const [waitingGroups, setWaitingGroups] = useState<WaitingGroup[]>([])
  const { toast } = useToast()
  const [cleaningTimers, setCleaningTimers] = useState<Record<number, NodeJS.Timeout>>({})

  // Initialize tables and waiting groups
  useEffect(() => {
    const fetchWaitingGroups = async () => {
      try {
        const response = await fetch("/api/waiting", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch waiting groups")
        }

        const data = await response.json()
        console.log("API response:", data)

        // Update waiting groups from API data
        if (data.waitingGroups && Array.isArray(data.waitingGroups)) {
          setWaitingGroups(data.waitingGroups)
        }
      } catch (error) {
        console.error("Error fetching waiting groups:", error)
        toast({
          title: "Error",
          description: "Failed to fetch waiting list data",
          variant: "destructive",
        })
      }
    }

    // Load tables from localStorage
    const savedTables = localStorage.getItem('restaurantTables')
    if (savedTables) {
      setTables(JSON.parse(savedTables))
    }

    // Fetch waiting groups from API
    fetchWaitingGroups()

    // Set up polling to refresh waiting list data every 30 seconds
    const intervalId = setInterval(fetchWaitingGroups, 30000)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [toast])

  useEffect(() => {
    return () => {
      // Clear all timers on component unmount
      Object.values(cleaningTimers).forEach((timer) => clearTimeout(timer))
    }
  }, [cleaningTimers])

  // Handle table status change
  const handleTableStatusChange = (tableId: number, newStatus: TableStatus) => {
    // Clear any existing timer for this table
    if (cleaningTimers[tableId]) {
      clearTimeout(cleaningTimers[tableId])
      const updatedTimers = { ...cleaningTimers }
      delete updatedTimers[tableId]
      setCleaningTimers(updatedTimers)
    }

    // If setting to cleaning, start a 5-minute timer
    if (newStatus === "cleaning") {
      const timer = setTimeout(
        () => {
          setTables((prevTables) => {
            const updatedTables = prevTables.map((table) =>
              table.id === tableId
                ? {
                    ...table,
                    status: "free",
                  }
                : table,
            )
            // Save to localStorage
            localStorage.setItem('restaurantTables', JSON.stringify(updatedTables))
            return updatedTables
          })

          toast({
            title: "Table cleaning complete",
            description: `Table ${tables.find((t) => t.id === tableId)?.number} is now available`,
          })

          // Remove the timer reference
          const updatedTimers = { ...cleaningTimers }
          delete updatedTimers[tableId]
          setCleaningTimers(updatedTimers)
        },
        10 * 1000,
      ) // 10 seconds for testing (would be 5 minutes in production)

      setCleaningTimers((prev) => ({
        ...prev,
        [tableId]: timer,
      }))
    }

    setTables((prevTables) => {
      const updatedTables = prevTables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: newStatus,
              occupiedAt: newStatus === "engaged" ? new Date().toISOString() : undefined,
            }
          : table,
      )
      // Save to localStorage
      localStorage.setItem('restaurantTables', JSON.stringify(updatedTables))
      return updatedTables
    })

    const statusMessages = {
      free: "Table marked as available",
      engaged: "Table marked as occupied",
      cleaning: "Table marked for cleaning (will be free in 5 minutes)",
    }

    toast({
      title: statusMessages[newStatus],
      description: `Table ${tables.find((t) => t.id === tableId)?.number} status updated`,
    })

    // Removed the automatic assignment of waiting groups when a table becomes free
  }

  // Remove waiting group from the list
  const removeWaitingGroup = async (groupId: number) => {
    try {
      const response = await fetch("/api/waiting", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId }), // Send as object
      });

      if (!response.ok) {
        throw new Error("Failed to remove waiting group");
      }

      const data = await response.json();
      console.log("API response:", data);

      if (Array.isArray(data.waitingGroups)) {
        setWaitingGroups(data.waitingGroups);
      }

      toast({
        title: "Group removed",
        description: "Group has been removed from the waiting list",
      });
    } catch (error) {
      console.error("Error removing group:", error);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case "free":
        return <Badge className="bg-green-500">Free</Badge>
      case "engaged":
        return <Badge className="bg-red-500">Engaged</Badge>
      case "cleaning":
        return <Badge className="bg-yellow-500">Cleaning</Badge>
    }
  }

  // Calculate time elapsed since table was occupied
  const getTimeElapsed = (occupiedAt?: string) => {
    if (!occupiedAt) return "N/A"

    const occupiedTime = new Date(occupiedAt).getTime()
    const currentTime = new Date().getTime()
    const elapsedMinutes = Math.floor((currentTime - occupiedTime) / (1000 * 60))

    return `${elapsedMinutes} min`
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
                <div className="text-3xl font-bold">{tables.filter((table) => table.status === "free").length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Occupied Tables</CardTitle>
                <CardDescription>Currently in use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{tables.filter((table) => table.status === "engaged").length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Waiting Groups</CardTitle>
                <CardDescription>Groups in queue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{waitingGroups.length}</div>
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
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tables.map((table) => (
                      <Card key={table.id} className="overflow-hidden">
                        <CardHeader className="bg-muted p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Table {table.number}</CardTitle>
                            {getStatusBadge(table.status)}
                          </div>
                          <CardDescription>Capacity: {table.capacity} people</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                          {table.status === "engaged" && (
                            <div className="mb-4 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>Set waiting time:</span>
                              </div>
                              <Select
                                defaultValue="15"
                                onValueChange={(value) => {
                                  toast({
                                    title: "Wait time set",
                                    description: `Table ${table.number} wait time set to ${value} minutes`,
                                  })
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select wait time" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5 minutes</SelectItem>
                                  <SelectItem value="10">10 minutes</SelectItem>
                                  <SelectItem value="15">15 minutes</SelectItem>
                                  <SelectItem value="30">30 minutes</SelectItem>
                                  <SelectItem value="60">1 hour</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {table.status !== "free" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTableStatusChange(table.id, "free")}
                              >
                                Mark Free
                              </Button>
                            )}

                            {table.status !== "engaged" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTableStatusChange(table.id, "engaged")}
                              >
                                Mark Engaged
                              </Button>
                            )}

                            {table.status !== "cleaning" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTableStatusChange(table.id, "cleaning")}
                              >
                                Mark Cleaning
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
                  {waitingGroups.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <h3 className="mb-2 text-lg font-semibold">No waiting groups</h3>
                      <p className="text-sm text-muted-foreground">All guests have been seated</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {waitingGroups.map((group, index) => (
                        <Card key={group.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">Group #{index + 1}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Size: {group.size} people
                                  {group.hasSeniors && ` (includes ${group.seniorCount} seniors)`}
                                </p>
                                <p className="text-sm text-muted-foreground">Mobile: {group.mobileNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  Waiting since: {new Date(group.checkInTime).toLocaleTimeString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => removeWaitingGroup(group.id)}>
                                  Remove
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // Find suitable table
                                    const suitableTable = tables.find(
                                      (table) => table.status === "free" && table.capacity >= group.size,
                                    )

                                    if (suitableTable) {
                                      handleTableStatusChange(suitableTable.id, "engaged")
                                      removeWaitingGroup(group.id)

                                      toast({
                                        title: "Group seated",
                                        description: `Group assigned to table ${suitableTable.number}`,
                                      })
                                    } else {
                                      toast({
                                        title: "No suitable table",
                                        description: "No free table with sufficient capacity",
                                        variant: "destructive",
                                      })
                                    }
                                  }}
                                >
                                  Seat Now
                                </Button>
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
    </div>
  )
}