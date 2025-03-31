import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import supabase from "@/app/supabase/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export enum TableStatus {
  engaged = "engaged",
  free = "free",
  cleaning = "cleaning",
}

export interface Table {
  tableId: number;
  tableName: string;
  capacity: number;
}

export interface TableState {
  tableId: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;

}

interface TableListState {
  tables: TableState[];
  loading: boolean;
  error: string | null;
}

const initialState: TableListState = {
  tables: [],
  loading: false,
  error: null,
};

// Async thunks for CRUD operations
export const fetchTables = createAsyncThunk(
  'tables/fetchTables',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*') //order by status fre
        
        .order('status')

      if (error) throw error;
      return data as TableState[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addTable = createAsyncThunk(
  'tables/addTable',
  async (table: Omit<TableState, 'tableId'>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert([table])
        .select();

      if (error) throw error;
      return data[0] as TableState;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTable = createAsyncThunk(
  'tables/updateTable',
  async (table: TableState, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .update({
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          status: table.status,
       
        })
        .eq('tableId', table.tableId)
        .select();

      if (error) throw error;
      return data[0] as TableState;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTable = createAsyncThunk(
  'tables/deleteTable',
  async (tableId: number, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('tableId', tableId);

      if (error) throw error;
      return tableId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Subscribe to real-time updates

export const subscribeToTables = createAsyncThunk(
    "tables/subscribeToTables",
    async (_, { dispatch }) => {
      const channel: RealtimeChannel = supabase
        .channel("tables_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tables" },
          () => {
            dispatch(fetchTables());
          }
        )
        .subscribe();
  
      return channel;
    }
  );
const tableSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tables
      .addCase(fetchTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTables.fulfilled, (state, action: PayloadAction<TableState[]>) => {
        state.tables = action.payload;
        state.loading = false;
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add table
      .addCase(addTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTable.fulfilled, (state, action: PayloadAction<TableState>) => {
        state.tables.push(action.payload);
        state.loading = false;
      })
      .addCase(addTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update table
      .addCase(updateTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTable.fulfilled, (state, action: PayloadAction<TableState>) => {
        const index = state.tables.findIndex(table => table.tableId === action.payload.tableId);
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete table
      .addCase(deleteTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTable.fulfilled, (state, action: PayloadAction<number>) => {
        state.tables = state.tables.filter(table => table.tableId !== action.payload);
        state.loading = false;
      })
      .addCase(deleteTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = tableSlice.actions;
export default tableSlice.reducer;