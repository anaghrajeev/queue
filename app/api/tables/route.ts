import { NextResponse } from "next/server"

// In a real application, you would connect to Firebase here
// This is a mock implementation for demonstration purposes

// Table status types
type TableStatus = "free" | "engaged" | "cleaning"

// Table interface
interface Table {
  id: number
  number: number
  capacity: number
  status: TableStatus
  occupiedAt?: string
}

// Mock database
const tables: Table[] = [
  { id: 1, number: 101, capacity: 2, status: "free" },
  { id: 2, number: 102, capacity: 2, status: "engaged", occupiedAt: new Date().toISOString() },
  { id: 3, number: 103, capacity: 4, status: "free" },
  { id: 4, number: 104, capacity: 4, status: "engaged", occupiedAt: new Date().toISOString() },
  { id: 5, number: 105, capacity: 4, status: "cleaning" },
  { id: 6, number: 106, capacity: 6, status: "free" },
  { id: 7, number: 107, capacity: 6, status: "engaged", occupiedAt: new Date().toISOString() },
  { id: 8, number: 108, capacity: 8, status: "free" },
]

export async function GET() {
  return NextResponse.json({ tables })
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()

    // Validate the data
    if (!data.tableId || !data.status) {
      return NextResponse.json({ error: "Invalid table data" }, { status: 400 })
    }

    // Find and update the table
    const tableIndex = tables.findIndex((table) => table.id === data.tableId)

    if (tableIndex === -1) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Update the table status
    tables[tableIndex] = {
      ...tables[tableIndex],
      status: data.status,
      occupiedAt: data.status === "engaged" ? new Date().toISOString() : undefined,
    }

    return NextResponse.json({
      success: true,
      message: "Table status updated",
      table: tables[tableIndex],
    })
  } catch (error) {
    console.error("Error updating table:", error)
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 })
  }
}

