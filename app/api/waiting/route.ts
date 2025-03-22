import { NextResponse } from "next/server"

// Waiting group interface
interface WaitingGroup {
  id: number
  size: number
  mobileNumber: string
  hasSeniors: boolean
  seniorCount: number
  checkInTime: string
  status: "waiting" | "seated" | "cancelled"
  assignedTable?: number
  seatedTime?: string
}

// Empty array to store waiting groups
let waitingGroups: WaitingGroup[] = []

export async function GET(request: Request) {
  const url = new URL(request.url)
  const groupId = url.searchParams.get("id")
  
  if (groupId) {
    // Return specific group if ID is provided
    const group = waitingGroups.find(g => g.id === parseInt(groupId))
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }
    return NextResponse.json({ group })
  }
  
  return NextResponse.json({ waitingGroups })
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate the data
    if (!data.size || data.size < 1) {
      return NextResponse.json({ error: "Invalid group size" }, { status: 400 })
    }

    // Create a new waiting group using the data from check-in form
    const newGroup: WaitingGroup = {
      id: waitingGroups.length > 0 ? Math.max(...waitingGroups.map((g) => g.id)) + 1 : 1,
      size: data.size,
      mobileNumber: data.mobileNumber || "Not provided",
      hasSeniors: data.hasSeniors || false,
      seniorCount: data.seniorCount || 0,
      checkInTime: new Date().toISOString(),
      status: "waiting"
    }

    // Add to the waiting list
    waitingGroups.push(newGroup)

    return NextResponse.json({
      success: true,
      message: "Group added to waiting list",
      group: newGroup,
      position: waitingGroups.filter(g => g.status === "waiting").length,
    })
  } catch (error) {
    console.error("Error adding waiting group:", error)
    return NextResponse.json({ error: "Failed to add group to waiting list" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 })
    }
    
    const groupIndex = waitingGroups.findIndex(group => group.id === data.groupId)
    
    if (groupIndex === -1) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }
    
    // Update group with new data
    waitingGroups[groupIndex] = {
      ...waitingGroups[groupIndex],
      ...data.updates,
      // If status is changing to seated, set seatedTime timestamp
      ...(data.updates.status === "seated" && { seatedTime: new Date().toISOString() })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Group updated successfully",
      group: waitingGroups[groupIndex],
      waitingGroups
    })
  } catch (error) {
    console.error("Error updating group:", error)
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const groupIdNum = Number.parseInt(groupId);
    const groupIndex = waitingGroups.findIndex(group => group.id === groupIdNum);
    
    if (groupIndex === -1) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    
    // Mark as cancelled instead of removing
    waitingGroups[groupIndex].status = "cancelled";

    return NextResponse.json({
      success: true,
      message: "Group removed from waiting list",
      waitingGroups: waitingGroups.filter(g => g.status === "waiting"), // Send only active waiting groups
    });
  } catch (error) {
    console.error("Error removing group:", error);
    return NextResponse.json({ error: "Failed to remove group" }, { status: 500 });
  }
}
