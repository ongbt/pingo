-- Grant execute on increment_sheet_play_count to both roles so the client
-- can call it via supabase.rpc() regardless of auth state.
GRANT EXECUTE ON FUNCTION public.increment_sheet_play_count(UUID) TO anon, authenticated;
