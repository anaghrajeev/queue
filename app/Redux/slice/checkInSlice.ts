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
      const state = getState() as { checkIn: CheckInListState };
      const currentCheckIns = state.checkIn.checkIns;
      
      let maxPosition = 0;
      if (currentCheckIns.length > 0) {
        maxPosition = Math.max(...currentCheckIns.map(checkin => checkin.queuePosition || 0));
      }
      
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

// Update Check-In Position
export const updateCheckInPosition = createAsyncThunk(
  "checkIn/updatePosition",
  async ({ id, queuePosition }: { id?: number, queuePosition: number }, { getState, rejectWithValue }) => {
    try {
      if (!id) throw new Error("Check-in ID is required");

      // First, update the specific check-in's position
      const { error: updateError } = await supabase
        .from("check_ins")
        .update({ queuePosition })
        .eq("id", id);

      if (updateError) throw updateError;

      // Fetch all check-ins to ensure we have the latest data
      const { data: allCheckIns, error: fetchError } = await supabase
        .from("check_ins")
        .select("*")
        .order('queuePosition', { ascending: true });

      if (fetchError) throw fetchError;

      // Reorder all positions to ensure consistency
      const reorderedCheckIns = allCheckIns
        .sort((a, b) => a.queuePosition - b.queuePosition)
        .map((checkIn, index) => ({
          ...checkIn,
          queuePosition: index + 1
        }));

      // Update all positions in the database
      const updates = reorderedCheckIns.map(checkIn => 
        supabase
          .from("check_ins")
          .update({ queuePosition: checkIn.queuePosition })
          .eq("id", checkIn.id)
      );

      await Promise.all(updates);

      return reorderedCheckIns as CheckInState[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Update Check-In Status
export const updateCheckInStatus = createAsyncThunk(
    "checkIn/updateStatus",
    async (
      { id, status, assignedTableId, seatedTime }: 
      { id?: number, status: "waiting" | "seated" | "cancelled", assignedTableId?: number, seatedTime?: string }, 
      { rejectWithValue, dispatch }
    ) => {
      try {
        if (!id) throw new Error("Check-in ID is required")
        
        const updateData: any = { status }
        if (assignedTableId) updateData.assignedTableId = assignedTableId
        if (seatedTime) updateData.seatedTime = seatedTime
        
        const { data, error } = await supabase
          .from("check_ins")
          .update(updateData)
          .eq("id", id)
          .select()
        
        if (error) throw error
  
        // If the status is "seated", update queue positions for remaining waiting groups
        if (status === "seated") {
          const { data: waitingGroups } = await supabase
            .from("check_ins")
            .select("*")
            .eq("status", "waiting")
            .order("queuePosition", { ascending: true })
  
          if (waitingGroups) {
            // Update queue positions
            const updates = waitingGroups.map((group, index) => 
              supabase
                .from("check_ins")
                .update({ queuePosition: index + 1 })
                .eq("id", group.id)
            )
            
            await Promise.all(updates)
          }
        }
        
        return data[0] as CheckInState
      } catch (error: any) {
        return rejectWithValue(error.message)
      }
    }
  )
  

// Delete Check-In from Supabase
export const deleteCheckIn = createAsyncThunk(
  "checkIn/deleteCheckIn",
  async (id: number, { rejectWithValue }) => {
    try {
      // First delete the check-in
      const { error: deleteError } = await supabase
        .from("check_ins")
        .delete()
        .eq("id", id);
      
      if (deleteError) throw deleteError;

      // Fetch remaining check-ins
      const { data: remainingCheckIns, error: fetchError } = await supabase
        .from("check_ins")
        .select("*")
        .order('queuePosition', { ascending: true });

      if (fetchError) throw fetchError;

      // Reorder remaining check-ins
      const reorderedCheckIns = remainingCheckIns
        .map((checkIn, index) => ({
          ...checkIn,
          queuePosition: index + 1
        }));

      // Update all positions
      const updates = reorderedCheckIns.map(checkIn =>
        supabase
          .from("check_ins")
          .update({ queuePosition: checkIn.queuePosition })
          .eq("id", checkIn.id)
      );

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
      .addCase(updateCheckInPosition.fulfilled, (state, action: PayloadAction<CheckInState[]>) => {
        state.checkIns = action.payload;
      })
      .addCase(updateCheckInStatus.fulfilled, (state, action: PayloadAction<CheckInState>) => {
        const index = state.checkIns.findIndex(checkIn => checkIn.id === action.payload.id);
        if (index !== -1) {
          state.checkIns[index] = action.payload;
        }
      })
      .addCase(deleteCheckIn.fulfilled, (state, action: PayloadAction<number>) => {
        state.checkIns = state.checkIns.filter(checkIn => checkIn.id !== action.payload);
      });
  },
});

export const { clearCheckIns } = checkInSlice.actions;
export default checkInSlice.reducer;