import { NextResponse } from "next/server"

// In a real application, you would connect to Firebase here
// This is a mock implementation for demonstration purposes

// Waiting group interface
interface WaitingGroup {
  id: number
  size: number
  mobileNumber: string
  hasSeniors: boolean
  seniorCount: number
  checkInTime: string
}

// Mock database
let waitingGroups: WaitingGroup[] = [
  {
    id: 1,
    size: 2,
    mobileNumber: "555-123-4567",
    hasSeniors: false,
    seniorCount: 0,
    checkInTime: new Date().toISOString(),
  },
  {
    id: 2,
    size: 4,
    mobileNumber: "555-234-5678",
    hasSeniors: true,
    seniorCount: 1,
    checkInTime: new Date().toISOString(),
  },
  {
    id: 3,
    size: 6,
    mobileNumber: "555-345-6789",
    hasSeniors: false,
    seniorCount: 0,
    checkInTime: new Date().toISOString(),
  },
]

export async function GET() {
  return NextResponse.json({ waitingGroups })
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate the data
    if (!data.size || data.size < 1) {
      return NextResponse.json({ error: "Invalid group size" }, { status: 400 })
    }

    // Create a new waiting group
    const newGroup: WaitingGroup = {
      id: waitingGroups.length > 0 ? Math.max(...waitingGroups.map((g) => g.id)) + 1 : 1,
      size: data.size,
      mobileNumber: data.mobileNumber || "Not provided",
      hasSeniors: data.hasSeniors || false,
      seniorCount: data.seniorCount || 0,
      checkInTime: new Date().toISOString(),
    }

    // Add to the waiting list
    waitingGroups.push(newGroup)

    return NextResponse.json({
      success: true,
      message: "Group added to waiting list",
      group: newGroup,
      position: waitingGroups.length,
    })
  } catch (error) {
    console.error("Error adding waiting group:", error)
    return NextResponse.json({ error: "Failed to add group to waiting list" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 })
    }

    const groupId = Number.parseInt(id)
    const initialLength = waitingGroups.length

    // Remove the group
    waitingGroups = waitingGroups.filter((group) => group.id !== groupId)

    if (waitingGroups.length === initialLength) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Group removed from waiting list",
    })
  } catch (error) {
    console.error("Error removing waiting group:", error)
    return NextResponse.json({ error: "Failed to remove group from waiting list" }, { status: 500 })
  }
}

