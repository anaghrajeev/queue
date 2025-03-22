import { NextResponse } from "next/server"

// Table status types
type TableStatus = "free" | "engaged" | "cleaning"

// Table interface
interface TableInterface {
  id: number
  number: number
  capacity: number
  status: TableStatus
  occupiedAt?: string
  estimatedWaitTime?: number
  assignedGroupId?: number
}

// Initialize with some default tables if none exist
let tables: TableInterface[] = [
  { id: 1, number: 1, capacity: 2, status: "free" },
  { id: 2, number: 2, capacity: 4, status: "free" },
  { id: 3, number: 3, capacity: 6, status: "free" },
  { id: 4, number: 4, capacity: 2, status: "free" },
  { id: 5, number: 5, capacity: 4, status: "free" },
]

export async function GET() {
  return NextResponse.json({ tables })
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.tableId) {
      return NextResponse.json({ error: "Table ID is required" }, { status: 400 })
    }
    
    const tableIndex = tables.findIndex(table => table.id === data.tableId)
    
    if (tableIndex === -1) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }
    
    // Update table with new data
    tables[tableIndex] = {
      ...tables[tableIndex],
      ...data.updates,
      // If status is changing to engaged, set occupiedAt timestamp
      ...(data.updates.status === "engaged" && { occupiedAt: new Date().toISOString() }),
      // If status is changing to free, remove occupiedAt and estimatedWaitTime
      ...(data.updates.status === "free" && { 
        occupiedAt: undefined, 
        estimatedWaitTime: undefined,
        assignedGroupId: undefined
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Table updated successfully",
      table: tables[tableIndex],
      tables
    })
  } catch (error) {
    console.error("Error updating table:", error)
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 })
  }
}
