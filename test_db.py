import sys
from database import supabase

test_h = {
    "id": "1111",
    "paciente_id": "9999",
    "paciente_nombre": "Test User",
    "fecha": "2026-06-23",
    "motivo": "Test",
    "sucursal": "Matriz"
}

try:
    res = supabase.table("historias_clinicas").upsert(test_h).execute()
    print("Success historia:", res)
except Exception as e:
    print("Error:", e)
