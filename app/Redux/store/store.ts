import { configureStore } from "@reduxjs/toolkit";
import checkInReducer, { fetchCheckIns,addCheckInToSupabase } from "../slice/checkInSlice";
import tableReducer, { fetchTables, subscribeToTables } from "../slice/tableSlice"
const store = configureStore({
  reducer: {
    checkIn: checkInReducer,
    tables:tableReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['your/action/type'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
});

store.dispatch(fetchCheckIns()); // Fetch data from Supabase on startup
store.dispatch(fetchTables()); // Fetch data from Supabase on startup


export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

