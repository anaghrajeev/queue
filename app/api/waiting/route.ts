import { NextResponse } from "next/server"

// Waiting group interface
interface WaitingGroup {
  id: number
  size: number
  mobileNumber: string
  hasSeniors: boolean
  seniorCount: number
  checkInTime: string
}

// Empty array to store waiting groups
let waitingGroups: WaitingGroup[] = []

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

    // Create a new waiting group using the data from check-in form
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
    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const groupIdNum = Number.parseInt(groupId);

    // Remove group if it exists
    const initialLength = waitingGroups.length;
    waitingGroups = waitingGroups.filter((group) => group.id !== groupIdNum);

    if (waitingGroups.length === initialLength) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Group removed from waiting list",
      waitingGroups, // Send updated list
    });
  } catch (error) {
    console.error("Error removing group:", error);
    return NextResponse.json({ error: "Failed to remove group" }, { status: 500 });
  }
}
