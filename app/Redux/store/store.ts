import { configureStore } from "@reduxjs/toolkit";
import checkInReducer, { fetchCheckIns,addCheckInToSupabase } from "../slice/checkInSlice";
import tableReducer from "../slice/tableSlice"
const store = configureStore({
  reducer: {
    checkIn: checkInReducer,
    tables:tableReducer
  },
});

store.dispatch(fetchCheckIns()); // Fetch data from Supabase on startup

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

