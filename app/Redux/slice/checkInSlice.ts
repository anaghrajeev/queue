// Updated checkInSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import supabase from "@/app/supabase/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface CheckInState {
  id?: number;
  name: string;
  numberOfPeople: number;
  mobileNumber: string;
  hasSeniors: boolean;
  seniorCount: number;
  isSubmitted: boolean;
  queuePosition: number;
  status?: "waiting" | "seated" | "cancelled";
  assignedTableId?: string;
  createdAt?: string;
}

interface CheckInListState {
  checkIns: CheckInState[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: CheckInListState = {
  checkIns: [],
  loading: false,
  error: null,
  lastUpdated: null
};

// Helper function to reorder queue positions
const reorderQueuePositions = (checkIns: CheckInState[]) => {
  return checkIns
    .filter(checkIn => checkIn.status === "waiting")
    .sort((a, b) => {
      // Sort by queuePosition, then by createdAt if positions are equal
      if (a.queuePosition !== b.queuePosition) {
        return a.queuePosition - b.queuePosition;
      }
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    })
    .map((checkIn, index) => ({
      ...checkIn,
      queuePosition: index + 1
    }));
};

export const fetchCheckIns = createAsyncThunk(
  "checkIn/fetchCheckIns",
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .order('queuePosition', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as CheckInState[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addCheckInToSupabase = createAsyncThunk(
  "checkIn/addCheckIn",
  async (newCheckIn: Omit<CheckInState, "id" | "queuePosition" | "status">, { rejectWithValue }) => {
    try {
      // Get current max position
      const { data: maxPositionData, error: maxError } = await supabase
        .from("check_ins")
        .select("queuePosition")
        .order("queuePosition", { ascending: false })
        .limit(1);
      
      if (maxError) throw maxError;
      
      const maxPosition = maxPositionData?.[0]?.queuePosition || 0;
      
      const checkInWithPosition = {
        ...newCheckIn,
        queuePosition: maxPosition + 1,
        status: "waiting" as const
      };
      
      const { data, error } = await supabase
        .from("check_ins")
        .insert([checkInWithPosition])
        .select();
      
      if (error) throw error;
      
      return data[0] as CheckInState;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCheckInStatus = createAsyncThunk(
  "checkIn/updateStatus",
  async (
    { id, status, assignedTableId }: 
    { id?: number, status: "waiting" | "seated" | "cancelled", assignedTableId?: number }, 
    { rejectWithValue }
  ) => {
    try {
      if (!id) throw new Error("Check-in ID is required");
      
      const updateData: Partial<CheckInState> = { status };
      if (assignedTableId) updateData.assignedTableId = String(assignedTableId);
      
      // First update the status
      const { data, error } = await supabase
        .from("check_ins")
        .update(updateData)
        .eq("id", id)
        .select();
      
      if (error) throw error;

      // If status changed to seated or cancelled, reorder waiting positions
      if (status !== "waiting") {
        const { data: waitingGroups, error: fetchError } = await supabase
          .from("check_ins")
          .select("*")
          .eq("status", "waiting")
          .order("queuePosition", { ascending: true })
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;

        if (waitingGroups) {
          const updates = waitingGroups.map((group, index) => 
            supabase
              .from("check_ins")
              .update({ queuePosition: index + 1 })
              .eq("id", group.id)
          );
          
          await Promise.all(updates);
        }
      }
      
      return data[0] as CheckInState;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCheckIn = createAsyncThunk(
  "checkIn/deleteCheckIn",
  async (id: number, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from("check_ins")
        .delete()
        .eq("id", id);
      
      if (error) throw error;

      // After deletion, fetch updated list to trigger reordering
      const { data: remainingCheckIns, error: fetchError } = await supabase
        .from("check_ins")
        .select("*")
        .order("queuePosition", { ascending: true })
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      // Reorder remaining check-ins
      const reorderedCheckIns = remainingCheckIns
        .map((checkIn, index) => ({
          ...checkIn,
          queuePosition: checkIn.status === "waiting" ? index + 1 : checkIn.queuePosition
        }));

      // Update positions in database
      const updates = reorderedCheckIns.map(checkIn =>
        supabase
          .from("check_ins")
          .update({ queuePosition: checkIn.queuePosition })
          .eq("id", checkIn.id)
      );

      await Promise.all(updates);

      return { id, updatedCheckIns: reorderedCheckIns };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const subscribeToCheckIns = createAsyncThunk(
  "checkIn/subscribeToCheckIns",
  async (_, { dispatch }) => {
    const channel = supabase
      .channel("check_ins_realtime")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "check_ins" 
        },
        (payload) => {
          // Only dispatch fetch if the change is relevant
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            dispatch(fetchCheckIns());
          }
        }
      )
      .subscribe();

    return channel;
  }
);
export const updateCheckInPosition = createAsyncThunk(
  "checkIn/updatePosition",
  async (
    { id, queuePosition }: { id?: number, queuePosition: number },
    { getState, rejectWithValue, dispatch }
  ) => {
    try {
      if (!id) throw new Error("Check-in ID is required");

      // First update the specific check-in's position
      const { error: updateError } = await supabase
        .from("check_ins")
        .update({ queuePosition })
        .eq("id", id);

      if (updateError) throw updateError;

      // Fetch all waiting check-ins to reorder
      const { data: waitingCheckIns, error: fetchError } = await supabase
        .from("check_ins")
        .select("*")
        .eq("status", "waiting")
        .order('queuePosition', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Create a map of all check-ins by ID for quick lookup
      const checkInsMap = new Map(waitingCheckIns.map(ci => [ci.id, ci]));

      // Get the check-in we're moving
      const movingCheckIn = checkInsMap.get(id);
      if (!movingCheckIn) throw new Error("Check-in not found");

      // Filter out the moving check-in and sort the rest
      const otherCheckIns = waitingCheckIns
        .filter(ci => ci.id !== id)
        .sort((a, b) => {
          // First sort by queue position
          if (a.queuePosition !== b.queuePosition) {
            return a.queuePosition - b.queuePosition;
          }
          // Then by creation time if positions are equal
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        });

      // Insert the moving check-in at its new position
      const updatedCheckIns = [
        ...otherCheckIns.slice(0, queuePosition - 1),
        movingCheckIn,
        ...otherCheckIns.slice(queuePosition - 1)
      ];

      // Update positions for all check-ins
      const updates = updatedCheckIns.map((checkIn, index) => ({
        ...checkIn,
        queuePosition: index + 1
      }));

      // Batch update all positions in the database
      const { error: batchError } = await supabase
        .from("check_ins")
        .upsert(updates);

      if (batchError) throw batchError;

      // Return the updated check-ins
      return updates;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
const checkInSlice = createSlice({
  name: "checkIn",
  initialState,
  reducers: {
    clearCheckIns(state) {
      state.checkIns = [];
    },
    setLastUpdated(state) {
      state.lastUpdated = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchCheckIns.pending, (state) => {
      state.loading = true;
      state.error = null;

      
    })
    .addCase(fetchCheckIns.fulfilled, (state, action: PayloadAction<CheckInState[]>) => {
      state.checkIns = action.payload;
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase(fetchCheckIns.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    .addCase(updateCheckInPosition.pending, (state) => {
      state.loading = true;
    })
    .addCase(updateCheckInPosition.fulfilled, (state, action: PayloadAction<CheckInState[]>) => {
      // Update all check-ins with their new positions
      const updatedCheckIns = state.checkIns.map(checkIn => {
        const updated = action.payload.find(ci => ci.id === checkIn.id);
        return updated || checkIn;
      });
      
      state.checkIns = updatedCheckIns;
      state.loading = false;
      state.lastUpdated = new Date().toISOString();
    })
    .addCase(updateCheckInPosition.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    .addCase(updateCheckInStatus.fulfilled, (state, action: PayloadAction<CheckInState>) => {
      const index = state.checkIns.findIndex(checkIn => checkIn.id === action.payload.id);
      if (index !== -1) {
        state.checkIns[index] = action.payload;
      }
      state.lastUpdated = new Date().toISOString();
    });
  },
});

export const { clearCheckIns, setLastUpdated } = checkInSlice.actions;
export default checkInSlice.reducer;