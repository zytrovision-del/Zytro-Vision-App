import sys
from database import supabase

try:
    res = supabase.table("usuarios").select("*").execute()
    print("Usuarios:", res.data)
except Exception as e:
    print("Error:", e)
