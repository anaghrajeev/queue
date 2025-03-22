import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import supabase from "@/app/supabase/supabase";

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
  async ({ id, queuePosition }: { id?: number, queuePosition: number }, { rejectWithValue }) => {
    try {
      if (!id) throw new Error("Check-in ID is required");
      
      const { data, error } = await supabase
        .from("check_ins")
        .update({ queuePosition })
        .eq("id", id)
        .select();
      
      if (error) throw error;
      
      return data[0] as CheckInState;
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
      .addCase(updateCheckInPosition.fulfilled, (state, action: PayloadAction<CheckInState>) => {
        const index = state.checkIns.findIndex(checkIn => checkIn.id === action.payload.id);
        if (index !== -1) {
          state.checkIns[index] = action.payload;
        }
      })
      
      // Update status
      .addCase(updateCheckInStatus.fulfilled, (state, action: PayloadAction<CheckInState>) => {
        const index = state.checkIns.findIndex(checkIn => checkIn.id === action.payload.id);
        if (index !== -1) {
          state.checkIns[index] = action.payload;
        }
      });
  },
});

export const { clearCheckIns } = checkInSlice.actions;
export default checkInSlice.reducer;