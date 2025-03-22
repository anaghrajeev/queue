import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL ="https://wpsxxmunhupdxqjxjzjn.supabase.co";  // Replace with your Supabase URL
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwc3h4bXVuaHVwZHhxanhqempuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTI2OTgsImV4cCI6MjA1ODIyODY5OH0._PDeEJFIPwqjAnBai4eSTk1YiDxmbIUyLyBxcMcGY-s"; // Replace with your Supabase anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
