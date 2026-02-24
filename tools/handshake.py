import os
from dotenv import load_dotenv
from supabase import create_client, Client

def main():
    # Load .env.local as it is standard for Next.js
    load_dotenv(".env.local")
    
    url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key or "your-supabase" in url:
        print("❌ Error: Missing or default Supabase credentials in .env.local")
        return

    try:
        supabase: Client = create_client(url, key)
        # Try a simple select to verify Link
        response = supabase.table("sheet").select("count").limit(1).execute()
        print("✅ Link Verified: Successfully connected to Supabase database.")
        print(f"Connection Details: {url}")
    except Exception as e:
        print(f"❌ Handshake Failed: {str(e)}")

if __name__ == "__main__":
    main()
