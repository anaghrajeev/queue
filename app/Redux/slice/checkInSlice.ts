
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import supabase from "@/app/supabase/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
interface CheckInState {
  id?: number;
  numberOfPeople: number;
  mobileNumber: string;
  hasSeniors: boolean;
  seniorCount: number;
  isSubmitted: boolean;
  queuePosition: number;
  status?: "waiting" | "seated" | "cancelled";
  assignedTableId?: number;
  seatedTime?: string;
}

interface CheckInListState {
  checkIns: CheckInState[];
  loading: boolean;
  error: string | null;
}

const initialState: CheckInListState = {
  checkIns: [],
  loading: false,
  error: null
};

// Fetch Check-Ins from Supabase
export const fetchCheckIns = createAsyncThunk(
  "checkIn/fetchCheckIns",
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .order('queuePosition', { ascending: true });
      
      if (error) throw error;
      return data as CheckInState[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Add Check-In to Supabase and Redux
export const addCheckInToSupabase = createAsyncThunk(
  "checkIn/addCheckIn",
  async (newCheckIn: Omit<CheckInState, "id" | "queuePosition" | "status">, { getState, rejectWithValue }) => {
    try {
      // Get the current state to determine the next queue position
      const state = getState() as { checkIn: CheckInListState };
      const currentCheckIns = state.checkIn.checkIns;
      
      // Find the highest queue position
      let maxPosition = 0;
      if (currentCheckIns.length > 0) {
        maxPosition = Math.max(...currentCheckIns.map(checkin => checkin.queuePosition || 0));
      }
      
      // Assign the next queue position and default status
      const checkInWithPosition = {
        ...newCheckIn,
        queuePosition: maxPosition + 1,
        status: "waiting" as const
      };
      
      // Insert into Supabase
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

// Update Check-In Position
export const updateCheckInPosition = createAsyncThunk(
  "checkIn/updatePosition",
  async ({ id, queuePosition }: { id?: number, queuePosition: number }, { getState, rejectWithValue }) => {
    try {
      if (!id) throw new Error("Check-in ID is required");

      const state = getState() as { checkIn: CheckInListState };
      const currentCheckIns = state.checkIn.checkIns;

      // Update the position of the specified check-in
      const updatedCheckIns = currentCheckIns.map(checkIn => {
        if (checkIn.id === id) {
          return { ...checkIn, queuePosition };
        }
        return checkIn;
      });

      // Reorder the queue positions
      const reorderedCheckIns = reorderQueuePositions(updatedCheckIns);

      // Update the positions in Supabase
      const updates = reorderedCheckIns.map(checkIn => {
        return supabase
          .from("check_ins")
          .update({ queuePosition: checkIn.queuePosition })
          .eq("id", checkIn.id)
          .select();
      });

      await Promise.all(updates);

      return reorderedCheckIns;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to reorder queue positions
const reorderQueuePositions = (checkIns: CheckInState[]): CheckInState[] => {
  return checkIns
    .sort((a, b) => a.queuePosition - b.queuePosition)
    .map((checkIn, index) => ({ ...checkIn, queuePosition: index + 1 }));
};

// Update Check-In Status
export const updateCheckInStatus = createAsyncThunk(
  "checkIn/updateStatus",
  async (
    { id, status, assignedTableId, seatedTime }: 
    { id?: number, status: "waiting" | "seated" | "cancelled", assignedTableId?: number, seatedTime?: string }, 
    { rejectWithValue }
  ) => {
    try {
      if (!id) throw new Error("Check-in ID is required");
      
      const updateData: any = { status };
      if (assignedTableId) updateData.assignedTableId = assignedTableId;
      if (seatedTime) updateData.seatedTime = seatedTime;
      
      const { data, error } = await supabase
        .from("check_ins")
        .update(updateData)
        .eq("id", id)
        .select();
      
      if (error) throw error;
      
      return data[0] as CheckInState;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete Check-In from Supabase
export const deleteCheckIn = createAsyncThunk(
  "checkIn/deleteCheckIn",
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("check_ins")
        .delete()
        .eq("id", id)
        .select();
      
      if (error) throw error;

      const state = getState() as { checkIn: CheckInListState };
      const currentCheckIns = state.checkIn.checkIns.filter(checkIn => checkIn.id !== id);

      // Reorder the queue positions
      const reorderedCheckIns = reorderQueuePositions(currentCheckIns);

      // Update the positions in Supabase
      const updates = reorderedCheckIns.map(checkIn => {
        return supabase
          .from("check_ins")
          .update({ queuePosition: checkIn.queuePosition })
          .eq("id", checkIn.id)
          .select();
      });

      await Promise.all(updates);

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Subscribe to real-time updates
export const subscribeToCheckIns = createAsyncThunk(
    "checkIn/subscribeToCheckIns",
    async (_, { dispatch }) => {
      const channel: RealtimeChannel = supabase
        .channel("check_ins_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "check_ins" },
          () => {
            dispatch(fetchCheckIns());
          }
        )
        .subscribe();
  
      return channel;
    }
  );

const checkInSlice = createSlice({
  name: "checkIn",
  initialState,
  reducers: {
    clearCheckIns(state) {
      state.checkIns = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch check-ins
      .addCase(fetchCheckIns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCheckIns.fulfilled, (state, action: PayloadAction<CheckInState[]>) => {
        state.checkIns = action.payload;
        state.loading = false;
      })
      .addCase(fetchCheckIns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add check-in
      .addCase(addCheckInToSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCheckInToSupabase.fulfilled, (state, action: PayloadAction<CheckInState>) => {
        state.checkIns.push(action.payload);
        state.loading = false;
      })
      .addCase(addCheckInToSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update position
      .addCase(updateCheckInPosition.fulfilled, (state, action: PayloadAction<CheckInState[]>) => {
        state.checkIns = action.payload;
      })
      
      // Update status
      .addCase(updateCheckInStatus.fulfilled, (state, action: PayloadAction<CheckInState>) => {
        if (action.payload) {
          const index = state.checkIns.findIndex(checkIn => checkIn.id === action.payload.id);
          if (index !== -1) {
            state.checkIns[index] = action.payload;
          }
        }
      })
      
      // Delete check-in
      .addCase(deleteCheckIn.fulfilled, (state, action: PayloadAction<number>) => {
        state.checkIns = state.checkIns.filter(checkIn => checkIn.id !== action.payload);
      });
  },
});

export const { clearCheckIns } = checkInSlice.actions;
export default checkInSlice.reducer;