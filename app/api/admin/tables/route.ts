import { NextResponse } from "next/server"

// Table interface
interface Table {
  id: number
  number: number
  capacity: number
  status: "free" | "engaged" | "cleaning"
}

// Mock database
let tables: Table[] = [
  { id: 1, number: 101, capacity: 2, status: "free" },
  { id: 2, number: 102, capacity: 2, status: "engaged" },
  { id: 3, number: 103, capacity: 4, status: "free" },
  { id: 4, number: 104, capacity: 4, status: "engaged" },
  { id: 5, number: 105, capacity: 4, status: "cleaning" },
  { id: 6, number: 106, capacity: 6, status: "free" },
  { id: 7, number: 107, capacity: 6, status: "engaged" },
  { id: 8, number: 108, capacity: 8, status: "free" },
]

// Get all tables
export async function GET() {
  return NextResponse.json({ tables })
}

// Add a new table
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate the data
    if (!data.number || !data.capacity) {
      return NextResponse.json({ error: "Table number and capacity are required" }, { status: 400 })
    }

    // Check if table number already exists
    if (tables.some((table) => table.number === data.number)) {
      return NextResponse.json({ error: "Table number already exists" }, { status: 400 })
    }

    // Create new table
    const newTable: Table = {
      id: tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1,
      number: data.number,
      capacity: data.capacity,
      status: "free",
    }

    // Add to tables
    tables.push(newTable)

    return NextResponse.json({
      success: true,
      message: "Table added successfully",
      table: newTable,
    })
  } catch (error) {
    console.error("Error adding table:", error)
    return NextResponse.json({ error: "Failed to add table" }, { status: 500 })
  }
}

// Update a table
export async function PUT(request: Request) {
  try {
    const data = await request.json()

    // Validate the data
    if (!data.id) {
      return NextResponse.json({ error: "Table ID is required" }, { status: 400 })
    }

    // Find the table
    const tableIndex = tables.findIndex((table) => table.id === data.id)

    if (tableIndex === -1) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    // Check if updating number and if it already exists
    if (
      data.number &&
      data.number !== tables[tableIndex].number &&
      tables.some((table) => table.number === data.number)
    ) {
      return NextResponse.json({ error: "Table number already exists" }, { status: 400 })
    }

    // Update the table
    tables[tableIndex] = {
      ...tables[tableIndex],
      number: data.number || tables[tableIndex].number,
      capacity: data.capacity || tables[tableIndex].capacity,
      status: data.status || tables[tableIndex].status,
    }

    return NextResponse.json({
      success: true,
      message: "Table updated successfully",
      table: tables[tableIndex],
    })
  } catch (error) {
    console.error("Error updating table:", error)
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 })
  }
}

// Delete a table
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Table ID is required" }, { status: 400 })
    }

    const tableId = Number.parseInt(id)
    const initialLength = tables.length

    // Remove the table
    tables = tables.filter((table) => table.id !== tableId)

    if (tables.length === initialLength) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Table deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting table:", error)
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 })
  }
}

