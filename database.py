"""
╔══════════════════════════════════════════════════════════════╗
║  HAPPY VISION · database.py                                  ║
║  Capa de acceso a datos Supabase                             ║
║  Todas las operaciones de lectura/escritura en la DB en nube ║
╚══════════════════════════════════════════════════════════════╝
"""

import os
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar .env si existe (entorno local)
load_dotenv()

# Intentar cargar desde variables de entorno (Streamlit Secrets o .env)
# Nota: Streamlit Cloud usa st.secrets.
try:
    import streamlit as st
    SUPABASE_URL = st.secrets.get("SUPABASE_URL", os.getenv("SUPABASE_URL"))
    SUPABASE_KEY = st.secrets.get("SUPABASE_KEY", os.getenv("SUPABASE_KEY"))
except ImportError:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Inicializar cliente Supabase solo si hay credenciales (para evitar errores en import)
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def _get_empresa_id() -> str:
    """Obtiene el ID de la empresa del usuario actual para asegurar aislamiento Multi-Tenant."""
    try:
        import streamlit as st
        # Si existe en session_state, usarlo. Si no, usar un demo/default para evitar crash en tests.
        return st.session_state.get("empresa_id", "empresa_demo")
    except:
        return "empresa_demo"

# ══════════════════════════════════════════════════════════════
# AUDITORÍA — Registro inmutable de cambios críticos
# ══════════════════════════════════════════════════════════════
def registrar_auditoria(accion: str, entidad: str = "", detalle: str = "",
                        usuario: str = "", nombre_usuario: str = "", sucursal: str = ""):
    """Registra un evento crítico en la tabla auditoria de Supabase.
    Nunca lanza excepciones para no interrumpir el flujo principal.
    """
    if not supabase:
        return
    try:
        from datetime import datetime, timezone
        supabase.table("auditoria").insert({
            "empresa_id":    _get_empresa_id(),
            "fecha_hora":    datetime.now(timezone.utc).isoformat(),
            "usuario":       usuario or "desconocido",
            "nombre_usuario": nombre_usuario or usuario,
            "accion":        accion,
            "entidad":       entidad,
            "detalle":       detalle,
            "sucursal":      sucursal,
        }).execute()
        # Confirmación visual opcional
        try:
            import streamlit as st
            st.toast(f"📝 Auditoría: {accion}")
        except: pass
    except Exception as e:
        print(f"[Auditoría] Error registrando evento: {e}")

def cargar_auditoria(limit: int = 500) -> pd.DataFrame:
    """Carga los registros de auditoría más recientes para el Admin."""
    try:
        if not supabase:
            return pd.DataFrame()
        res = supabase.table("auditoria").select("*").eq("empresa_id", _get_empresa_id()).order("fecha_hora", desc=True).limit(limit).execute()
        return pd.DataFrame(res.data) if res.data else pd.DataFrame()
    except Exception as e:
        print(f"Error cargar_auditoria: {e}")
        return pd.DataFrame()

# ══════════════════════════════════════════════════════════════
# INVENTARIO (MONTURAS)
# ══════════════════════════════════════════════════════════════
def cargar_inventario(sucursal: str = None) -> pd.DataFrame:
    """Carga el inventario de monturas."""
    try:
        if not supabase: return pd.DataFrame()
        query = supabase.table("inventario").select("*").eq("empresa_id", _get_empresa_id())
        if sucursal:
            query = query.eq("sucursal", sucursal)
        res = query.order("marca").execute()
        return pd.DataFrame(res.data) if res.data else pd.DataFrame()
    except Exception as e:
        print(f"Error cargar_inventario: {e}")
        return pd.DataFrame()

def guardar_producto(data: dict):
    """Guarda o actualiza una montura en el inventario."""
    try:
        if not supabase: return
        data["empresa_id"] = _get_empresa_id()
        if "id" in data:
            supabase.table("inventario").update(data).eq("id", data["id"]).eq("empresa_id", _get_empresa_id()).execute()
        else:
            supabase.table("inventario").insert(data).execute()
    except Exception as e:
        print(f"Error guardar_producto: {e}")

def eliminar_producto(id_producto: int):
    """Elimina un producto del inventario."""
    try:
        if not supabase: return
        supabase.table("inventario").delete().eq("id", id_producto).eq("empresa_id", _get_empresa_id()).execute()
    except Exception as e:
        print(f"Error eliminar_producto: {e}")

# ══════════════════════════════════════════════════════════════
# TRABAJOS (ÓRDENES) Y PAGOS
# ══════════════════════════════════════════════════════════════
def cargar_ordenes_trabajo(sucursal: str = None) -> pd.DataFrame:
    """Carga las órdenes de trabajo junto con sus pagos."""
    try:
        if not supabase: return pd.DataFrame()
        # Traemos la orden y el pago asociado (join simple de Supabase)
        query = supabase.table("ordenes_trabajo").select("*, pagos_y_saldos(*)").eq("empresa_id", _get_empresa_id())
        if sucursal:
            query = query.eq("sucursal", sucursal)
        res = query.order("id", desc=True).execute()
        return pd.DataFrame(res.data) if res.data else pd.DataFrame()
    except Exception as e:
        print(f"Error cargar_ordenes_trabajo: {e}")
        return pd.DataFrame()

def guardar_orden_trabajo(orden_data: dict):
    """Guarda una orden de trabajo técnica y su estado financiero."""
    try:
        if not supabase: return None
        # Insertar Orden con todos los campos técnicos (receta, etc)
        orden_data["empresa_id"] = _get_empresa_id()
        res = supabase.table("ordenes_trabajo").insert(orden_data).execute()
        if res.data:
            nueva_id = res.data[0]["id"]
            registrar_auditoria("Nueva Orden Óptica", "Laboratorio", f"Orden #{nueva_id} | Paciente: {orden_data.get('paciente_nombre')}", st.session_state.user_login, sucursal=orden_data.get("sucursal"))
            return nueva_id
        return None
    except Exception as e:
        print(f"Error guardar_orden_trabajo: {e}")
        return None

def actualizar_estado_orden(orden_id: int, nuevo_estado: str, usuario: str = "", sucursal: str = ""):
    """Actualiza el estado de una orden (Pendiente -> Laboratorio -> etc)."""
    try:
        if not supabase: return
        supabase.table("ordenes_trabajo").update({"estado": nuevo_estado}).eq("id", orden_id).eq("empresa_id", _get_empresa_id()).execute()
        registrar_auditoria(
            accion="Cambio Estado Orden",
            entidad="Laboratorio",
            detalle=f"Orden ID {orden_id} pasó a estado: {nuevo_estado}",
            usuario=usuario,
            sucursal=sucursal
        )
    except Exception as e:
        print(f"Error actualizar_estado_orden: {e}")

# ══════════════════════════════════════════════════════════════
# CONTABILIDAD Y CAJA
# ══════════════════════════════════════════════════════════════
def obtener_estado_caja(sucursal: str, fecha: str) -> dict:
    """Busca si hay una caja abierta para hoy en esta sucursal."""
    try:
        if not supabase: return None
        res = supabase.table("caja_diaria").select("*").eq("empresa_id", _get_empresa_id()).eq("sucursal", sucursal).eq("fecha", fecha).execute()
        return res.data[0] if res.data else None
    except: return None

def abrir_caja(data: dict):
    """Crea el registro de apertura de caja."""
    try:
        if not supabase: return
        data["empresa_id"] = _get_empresa_id()
        supabase.table("caja_diaria").insert(data).execute()
        registrar_auditoria("Apertura de Caja", "Contabilidad", f"Monto inicial: ${data['monto_apertura']}", data['abierta_por'], sucursal=data['sucursal'])
    except Exception as e: print(f"Error abrir_caja: {e}")

def registrar_gasto(data: dict):
    """Registra un egreso de dinero."""
    try:
        if not supabase: return
        data["empresa_id"] = _get_empresa_id()
        supabase.table("gastos").insert(data).execute()
        registrar_auditoria("Gasto Registrado", "Contabilidad", f"{data['categoria']}: ${data['monto']}", data['usuario'], sucursal=data['sucursal'])
    except Exception as e: print(f"Error registrar_gasto: {e}")

def obtener_resumen_dia(sucursal: str, fecha: str):
    """Calcula totales de ventas y gastos del día para el cierre, 
    sumando ingresos de ventas directas y abonos de órdenes.
    """
    try:
        if not supabase: return {"Efectivo":0, "Tarjeta":0, "Transferencia":0, "Gastos":0}
        
        totales = {"Efectivo":0, "Tarjeta":0, "Transferencia":0, "Gastos":0}
        
        # 1. Ingresos desde tabla 'ventas' (Nuevos registros internos)
        res_ventas = supabase.table("ventas").select("abono, metodo_pago").eq("empresa_id", _get_empresa_id()).eq("sucursal", sucursal).filter("fecha", "gte", f"{fecha}T00:00:00").execute()
        for v in res_ventas.data:
            m = v.get("metodo_pago", "Efectivo")
            if m in totales:
                totales[m] += float(v.get("abono", 0))
        
        # 2. Ingresos desde 'ordenes_trabajo' (Abonos de órdenes creadas directamente o saldos)
        # Nota: Filtramos por 'creado_el' para nuevos abonos o podríamos tener una tabla de pagos específica.
        # Por ahora, sumamos abonos de órdenes cuya fecha coincida.
        res_ordenes = supabase.table("ordenes_trabajo").select("abono, metodo_pago").eq("empresa_id", _get_empresa_id()).eq("sucursal", sucursal).filter("creado_el", "gte", f"{fecha}T00:00:00").execute()
        # Evitar duplicar si la venta ya registró el abono en la tabla ventas.
        # Pero como la app está separando módulos, esto dependerá del flujo.
        # Para ser conservadores y no duplicar, si ya sumamos de 'ventas', 
        # solo sumamos de 'ordenes' si no provienen de una venta directa.
        
        # 3. Gastos
        res_g = supabase.table("gastos").select("monto").eq("empresa_id", _get_empresa_id()).eq("sucursal", sucursal).eq("fecha", fecha).execute()
        totales["Gastos"] = sum(float(g["monto"]) for g in res_g.data)
        
        return totales
    except Exception as e:
        print(f"Error obtener_resumen_dia: {e}")
        return {"Efectivo":0, "Tarjeta":0, "Transferencia":0, "Gastos":0}

def cerrar_caja(caja_id: int, data: dict):
    """Cierra la caja del día."""
    try:
        if not supabase: return
        supabase.table("caja_diaria").update(data).eq("id", caja_id).eq("empresa_id", _get_empresa_id()).execute()
        registrar_auditoria("Cierre de Caja", "Contabilidad", f"Cierre final: ${data['monto_cierre']}", data['cerrada_por'], sucursal=data['sucursal'])
    except Exception as e: print(f"Error cerrar_caja: {e}")

def actualizar_historia(historia_id: int, data: dict):
    """Actualiza campos de una historia clínica en Supabase."""
    try:
        if not supabase: return
        supabase.table("historias").update(data).eq("id", historia_id).eq("empresa_id", _get_empresa_id()).execute()
        registrar_auditoria("Actualizar Historia", "Clínica", f"ID Historia: {historia_id}", st.session_state.user_login, sucursal=st.session_state.get("sucursal_activa", ""))
    except Exception as e: print(f"Error actualizar_historia: {e}")

def registrar_venta_directa(data: dict):
    """Registra una venta detallada (incluyendo costos para admin) y descuenta stock."""
    try:
        if not supabase: return None
        # 1. Registrar la venta en la tabla 'ventas' (ahora incluye costo_total para rentabilidad)
        data["empresa_id"] = _get_empresa_id()
        res = supabase.table("ventas").insert(data).execute()
        
        # 2. Descontar stock de monturas si aplica
        for item in data.get("detalles", []):
            p_id = item.get("id_armazon") # ID del armazón del inventario
            if p_id:
                curr = supabase.table("inventario").select("cantidad_disponible").eq("id", p_id).eq("empresa_id", _get_empresa_id()).execute()
                if curr.data:
                    stock_actual = float(curr.data[0].get("cantidad_disponible", 0))
                    nuevo_stock = max(0, stock_actual - 1)
                    supabase.table("inventario").update({"cantidad_disponible": nuevo_stock}).eq("id", p_id).eq("empresa_id", _get_empresa_id()).execute()
        
        # 3. Auditoría detallada
        costo = data.get('costo_total', 0)
        ganancia = float(data['total']) - float(costo)
        registrar_auditoria("Venta Óptica", "Ventas", f"Total: ${data['total']} | Ganancia: ${ganancia:.2f} | Cliente: {data.get('cliente')}", st.session_state.user_login, sucursal=data['sucursal'])
        return res.data[0] if res.data else True
    except Exception as e:
        print(f"Error registrar_venta_directa: {e}")
        return None

def cargar_ventas_historial(sucursal: str = None) -> pd.DataFrame:
    """Carga el historial completo de ventas para análisis de rentabilidad."""
    try:
        if not supabase: return pd.DataFrame()
        query = supabase.table("ventas").select("*").eq("empresa_id", _get_empresa_id())
        if sucursal and sucursal != "Todas":
            query = query.eq("sucursal", sucursal)
        res = query.order("fecha", desc=True).execute()
        return pd.DataFrame(res.data) if res.data else pd.DataFrame()
    except Exception as e:
        print(f"Error cargar_ventas_historial: {e}")
        return pd.DataFrame()

def registrar_pago_saldo(orden_id: int, monto: float, metodo: str, usuario: str, sucursal: str):
    """Registra el pago de un saldo pendiente de una orden de trabajo."""
    try:
        if not supabase: return
        # 1. Obtener orden
        res = supabase.table("ordenes_trabajo").select("saldo, abono").eq("id", orden_id).eq("empresa_id", _get_empresa_id()).execute()
        if res.data:
            orden = res.data[0]
            nuevo_abono = float(orden["abono"]) + monto
            nuevo_saldo = max(0, float(orden["saldo"]) - monto)
            
            # 2. Actualizar orden
            upd = {"abono": nuevo_abono, "saldo": nuevo_saldo}
            if nuevo_saldo == 0: upd["estado"] = "Entregado" # Autocierre
            
            supabase.table("ordenes_trabajo").update(upd).eq("id", orden_id).eq("empresa_id", _get_empresa_id()).execute()
            
            # 3. Auditoría
            registrar_auditoria("Cobro de Saldo", "Ventas", f"Orden #{orden_id} | Cobrado: ${monto}", usuario, sucursal=sucursal)
            return True
    except Exception as e:
        print(f"Error registrar_pago_saldo: {e}")
        return False

# ══════════════════════════════════════════════════════════════
# PACIENTES
# ══════════════════════════════════════════════════════════════
def cargar_pacientes() -> pd.DataFrame:
    """Carga todos los pacientes desde Supabase."""
    try:
        if not supabase: return _empty_pacientes_df()
        response = supabase.table("pacientes").select("*").eq("empresa_id", _get_empresa_id()).execute()
        data = response.data
        if data:
            # Reemplazar None por string vacío para mantener compatibilidad con la app
            df = pd.DataFrame(data).fillna("")
            return df
        return _empty_pacientes_df()
    except Exception as e:
        print(f"Error cargar_pacientes: {e}")
        return _empty_pacientes_df()

def _empty_pacientes_df() -> pd.DataFrame:
    return pd.DataFrame(columns=[
        "id", "identificacion", "nombre", "nombres", "apellidos",
        "genero", "direccion", "edad", "fecha_nacimiento",
        "telefono", "correo", "ocupacion"
    ])

def guardar_paciente(row: dict):
    """Inserta o actualiza un paciente en Supabase."""
    try:
        if not supabase: return
        # Asegurar que todos los valores sean string
        row["empresa_id"] = _get_empresa_id()
        row_str = {k: str(v) if v is not None else "" for k, v in row.items()}
        supabase.table("pacientes").upsert(row_str).execute()
    except Exception as e:
        print(f"Error guardar_paciente: {e}")

def guardar_todos_pacientes(df: pd.DataFrame):
    """Sincroniza el DataFrame completo de pacientes a Supabase."""
    try:
        if not supabase: return
        # Convertir todo a string
        df_str = df.astype(str)
        # Reemplazar "nan" por ""
        df_str = df_str.replace("nan", "")
        records = df_str.to_dict(orient="records")
        for rec in records:
            rec["empresa_id"] = _get_empresa_id()
        if records:
            supabase.table("pacientes").upsert(records).execute()
    except Exception as e:
        print(f"Error guardar_todos_pacientes: {e}")
        try:
            import streamlit as st
            st.session_state["db_error"] = f"Error guardando pacientes en la base de datos: {e}"
        except: pass

def eliminar_paciente(p_id):
    """Elimina permanentemente un paciente de Supabase."""
    try:
        if not supabase: return
        supabase.table("pacientes").delete().eq("id", str(p_id)).eq("empresa_id", _get_empresa_id()).execute()
    except Exception as e:
        print(f"Error eliminar_paciente: {e}")

PACIENTES_COLS = [
    "id", "identificacion", "nombre", "nombres", "apellidos", "genero", 
    "direccion", "edad", "fecha_nacimiento", "telefono", "correo", "ocupacion", "sucursal"
]

HISTORIAS_COLS = [
    "id", "paciente_id", "paciente_nombre", "fecha",
    "ant_personales", "ant_familiares", "motivo", "diabetes", "hipertension", 
    "patologia_otra", "observaciones", "lenso_od", "lenso_av_lej_od", "lenso_av_cer_od",
    "lenso_oi", "lenso_av_lej_oi", "lenso_av_cer_oi",
    "rx_od", "rx_av_lej_od", "rx_av_cer_od",
    "rx_oi", "rx_av_lej_oi", "rx_av_cer_oi",
    "estado_muscular", "seg_externo", "test_colores", "estado_refractivo",
    "diagnostico", "disposicion", "recomendaciones",
    "meses_proximo_control", "necesita_lentes", "test_color", "sucursal"
]

def migrar_estructuras():
    """Asegura que los DataFrames locales y remotos tengan todas las columnas necesarias."""
    try:
        import streamlit as st
        # 1. Migrar Pacientes
        if "df_pacientes" in st.session_state:
            df_p = st.session_state.df_pacientes
            for col in PACIENTES_COLS:
                if col not in df_p.columns:
                    # Asignar 'Matriz' a pacientes antiguos si no tienen sucursal
                    df_p[col] = "Matriz" if col == "sucursal" else ""
            
            # Limpiar sucursales vacías que pudieran haber quedado
            df_p.loc[df_p['sucursal'] == '', 'sucursal'] = 'Matriz'
            df_p.loc[df_p['sucursal'].isna(), 'sucursal'] = 'Matriz'
            st.session_state.df_pacientes = df_p[PACIENTES_COLS]
        
        # 2. Migrar Historias
        if "df_historias" in st.session_state:
            df_h = st.session_state.df_historias
            for col in HISTORIAS_COLS:
                if col not in df_h.columns:
                    # Asignar 'Matriz' a historias antiguas
                    df_h[col] = "Matriz" if col == "sucursal" else ""
            
            # Limpiar sucursales vacías que pudieran haber quedado
            df_h.loc[df_h['sucursal'] == '', 'sucursal'] = 'Matriz'
            df_h.loc[df_h['sucursal'].isna(), 'sucursal'] = 'Matriz'
            st.session_state.df_historias = df_h[HISTORIAS_COLS]
            
        # 3. Migrar Usuarios (Nuevos Permisos)
        try:
            res_u = supabase.table("usuarios").select("*").execute()
            if res_u.data:
                for usr in res_u.data:
                    if not usr.get("accesos") or "Generar Orden" not in usr.get("accesos", []):
                        # Asignar accesos base a usuarios antiguos incluyendo la nueva pestaña
                        default_acc = ["Pacientes", "Generar Orden", "Trabajos", "Ventas", "Inicio"]
                        if "Administrador" in str(usr.get("role", "")):
                            default_acc = ["Pacientes", "Generar Orden", "Trabajos", "Ventas", "Inventario", "Contabilidad", "Usuarios", "Configuracion", "Inicio"]
                        supabase.table("usuarios").update({"accesos": default_acc}).eq("username", usr["username"]).execute()
        except Exception as ue:
            print(f"Error migrando permisos de usuarios: {ue}")

        print("Migración de estructuras completada exitosamente.")
    except Exception as e:
        print(f"Error en migración: {e}")

# ══════════════════════════════════════════════════════════════
# HISTORIAS CLÍNICAS
# ══════════════════════════════════════════════════════════════

def cargar_historias() -> pd.DataFrame:
    """Carga todas las historias clínicas desde Supabase."""
    try:
        if not supabase: return pd.DataFrame(columns=HISTORIAS_COLS)
        response = supabase.table("historias_clinicas").select("*").eq("empresa_id", _get_empresa_id()).execute()
        df = pd.DataFrame(response.data)
        # Asegurar columnas tras la carga
        for col in HISTORIAS_COLS:
            if col not in df.columns:
                df[col] = ""
        return df[HISTORIAS_COLS] if not df.empty else pd.DataFrame(columns=HISTORIAS_COLS)
    except Exception as e:
        print(f"Error cargar_historias: {e}")
        return pd.DataFrame(columns=HISTORIAS_COLS)

def _empty_historias_df() -> pd.DataFrame:
    return pd.DataFrame(columns=HISTORIAS_COLS)

def guardar_historia(row: dict):
    """Inserta o actualiza una historia clínica en Supabase."""
    try:
        if not supabase: return
        # Asegurar string y limpiar nulos
        row["empresa_id"] = _get_empresa_id()
        row_str = {k: str(v) if v is not None else "" for k, v in row.items()}
        supabase.table("historias_clinicas").upsert(row_str).execute()
    except Exception as e:
        print(f"Error guardar_historia: {e}")

def guardar_todas_historias(df: pd.DataFrame):
    """Sincroniza el DataFrame completo de historias a Supabase."""
    try:
        if not supabase: return
        # Asegurar limpieza total de NaNs y conversión a strings
        df_limpio = df.copy().fillna("")
        records = []
        for _, row in df_limpio.iterrows():
            rec = {str(k): (str(v) if not pd.isna(v) and str(v).lower() != "nan" else "") for k, v in row.to_dict().items()}
            rec["empresa_id"] = _get_empresa_id()
            records.append(rec)
            
        if records:
            supabase.table("historias_clinicas").upsert(records).execute()
    except Exception as e:
        import traceback
        err_detail = traceback.format_exc()
        try:
            import streamlit as st
            st.session_state["db_error"] = f"🔥 ERROR CRÍTICO SUPABASE: {str(e)}\n\nDetalle técnico:\n{err_detail}"
        except: pass

def eliminar_historia(h_id):
    """Elimina permanentemente una historia de Supabase."""
    try:
        if not supabase: return
        supabase.table("historias_clinicas").delete().eq("id", str(h_id)).eq("empresa_id", _get_empresa_id()).execute()
    except Exception as e:
        print(f"Error eliminar_historia: {e}")

# ══════════════════════════════════════════════════════════════
# SUCURSALES
# ══════════════════════════════════════════════════════════════

def cargar_sucursales() -> pd.DataFrame:
    """Carga todas las sucursales desde Supabase."""
    try:
        if not supabase: return pd.DataFrame(columns=["nombre", "direccion", "telefono", "ciudad"])
        response = supabase.table("sucursales").select("*").eq("empresa_id", _get_empresa_id()).order("nombre").execute()
        return pd.DataFrame(response.data) if response.data else pd.DataFrame(columns=["nombre", "direccion", "telefono", "ciudad"])
    except Exception as e:
        print(f"Error cargar_sucursales: {e}")
        return pd.DataFrame(columns=["nombre", "direccion", "telefono", "ciudad"])

def guardar_sucursal(row: dict):
    """Guarda o actualiza una sucursal."""
    try:
        if not supabase: return False, "Sin conexión a Supabase"
        row["empresa_id"] = _get_empresa_id()
        supabase.table("sucursales").upsert(row).execute()
        return True, "Guardado exitosamente"
    except Exception as e:
        print(f"Error guardar_sucursal: {e}")
        return False, str(e)

def eliminar_sucursal(s_id):
    """Elimina una sucursal."""
    try:
        if not supabase: return
        supabase.table("sucursales").delete().eq("id", s_id).eq("empresa_id", _get_empresa_id()).execute()
    except Exception as e:
        print(f"Error eliminar_sucursal: {e}")

def cargar_ordenes_trabajo(sucursal: str = None) -> pd.DataFrame:
    """Carga todas las órdenes de trabajo desde Supabase."""
    try:
        if not supabase: return pd.DataFrame()
        query = supabase.table("ordenes_trabajo").select("*").eq("empresa_id", _get_empresa_id())
        if sucursal and sucursal != "Todas":
            query = query.eq("sucursal", sucursal)
        res = query.order("creado_el", desc=True).execute()
        return pd.DataFrame(res.data) if res.data else pd.DataFrame()
    except Exception as e:
        print(f"Error cargar_ordenes_trabajo: {e}")
        return pd.DataFrame()

def actualizar_estado_orden(orden_id: int, nuevo_estado: str, usuario: str, sucursal: str):
    """Actualiza el estado de una orden de trabajo (ej: Pendiente -> Listo)."""
    try:
        if not supabase: return
        supabase.table("ordenes_trabajo").update({"estado": nuevo_estado}).eq("id", orden_id).eq("empresa_id", _get_empresa_id()).execute()
        registrar_auditoria("Cambio de Estado", "Orden de Trabajo", f"Orden #{orden_id} pasó a {nuevo_estado}", usuario, sucursal=sucursal)
    except Exception as e:
        print(f"Error actualizar_estado_orden: {e}")

def cargar_orden_trabajo_detallada(orden_id: int):
    """Carga una orden específica con todos sus detalles."""
    try:
        if not supabase: return None
        res = supabase.table("ordenes_trabajo").select("*").eq("id", orden_id).eq("empresa_id", _get_empresa_id()).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"Error cargar_orden_trabajo_detallada: {e}")
        return None

# ══════════════════════════════════════════════════════════════
# CITAS
# ══════════════════════════════════════════════════════════════
def cargar_citas_hoy(sucursal: str = None) -> pd.DataFrame:
    """Carga las citas agendadas para el día actual."""
    try:
        if not supabase: return pd.DataFrame()
        hoy = pd.Timestamp.now().strftime("%Y-%m-%d")
        query = supabase.table("citas").select("*").eq("empresa_id", _get_empresa_id()).eq("fecha", hoy)
        if sucursal and sucursal != "Todas":
            query = query.eq("sucursal", sucursal)
        res = query.order("hora").execute()
        return pd.DataFrame(res.data) if res.data else pd.DataFrame()
    except Exception as e:
        print(f"Error cargar_citas_hoy: {e}")
        return pd.DataFrame()

def cargar_todas_citas(sucursal: str = None) -> pd.DataFrame:
    """Carga todas las citas."""
    try:
        if not supabase: return pd.DataFrame()
        query = supabase.table("citas").select("*").eq("empresa_id", _get_empresa_id())
        if sucursal and sucursal != "Todas":
            query = query.eq("sucursal", sucursal)
        res = query.order("fecha").order("hora").execute()
        return pd.DataFrame(res.data) if res.data else pd.DataFrame()
    except Exception as e:
        print(f"Error cargar_todas_citas: {e}")
        return pd.DataFrame()

def guardar_cita(data: dict):
    """Guarda o actualiza una cita en la base de datos."""
    try:
        if not supabase: return
        data["empresa_id"] = _get_empresa_id()
        if "id" in data and data["id"]:
            supabase.table("citas").update(data).eq("id", data["id"]).eq("empresa_id", _get_empresa_id()).execute()
        else:
            supabase.table("citas").insert(data).execute()
        registrar_auditoria("Agendar Cita", "Citas", f"Cita {data.get('motivo', '')} para {data.get('paciente_nombre', '')}", st.session_state.user_login, sucursal=data.get("sucursal", ""))
    except Exception as e:
        print(f"Error guardar_cita: {e}")

def eliminar_cita(cita_id: int):
    """Elimina una cita."""
    try:
        if not supabase: return
        supabase.table("citas").delete().eq("id", cita_id).eq("empresa_id", _get_empresa_id()).execute()
        registrar_auditoria("Eliminar Cita", "Citas", f"Cita eliminada ID: {cita_id}", st.session_state.user_login, sucursal=st.session_state.get("sucursal_activa", ""))
    except Exception as e:
        print(f"Error eliminar_cita: {e}")

# ══════════════════════════════════════════════════════════════
# SUSCRIPCIONES (FASE 2)
# ══════════════════════════════════════════════════════════════
def obtener_estado_suscripcion(empresa_id: str) -> dict:
    """Obtiene el estado actual de la suscripción de una empresa específica."""
    try:
        if not supabase: return {"estado_pago": "Vencido"}
        res = supabase.table("suscripciones").select("*").eq("empresa_id", empresa_id).execute()
        if res.data:
            return res.data[0]
        else:
            # Si no existe registro, por seguridad se bloquea el acceso.
            return {"estado_pago": "Vencido"}
    except Exception as e:
        print(f"Error obtener_estado_suscripcion: {e}")
        return {"estado_pago": "Vencido"}

def actualizar_suscripcion_exitosa(empresa_id: str):
    """Actualiza la suscripción a Activo y suma 30 días a la fecha actual."""
    try:
        if not supabase: return False
        from datetime import datetime, timedelta
        nueva_fecha = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Intentamos actualizar el registro existente
        res = supabase.table("suscripciones").update({
            "estado_pago": "Activo",
            "fecha_vencimiento": nueva_fecha,
            "fecha_actualizacion": datetime.now().isoformat()
        }).eq("empresa_id", empresa_id).execute()
        
        # Si no había registro, lo insertamos
        if not res.data:
            supabase.table("suscripciones").insert({
                "empresa_id": empresa_id,
                "estado_pago": "Activo",
                "fecha_vencimiento": nueva_fecha,
                "fecha_actualizacion": datetime.now().isoformat()
            }).execute()
        return True
    except Exception as e:
        print(f"Error actualizar_suscripcion_exitosa: {e}")
        return False

# ══════════════════════════════════════════════════════════════
# AUTO-REGISTRO SAAS (FASE 4)
# ══════════════════════════════════════════════════════════════
def crear_cuenta_saas(datos_usuario: dict) -> tuple[bool, str]:
    """Crea un usuario, genera su empresa_id, y otorga 15 días de prueba."""
    try:
        if not supabase: return False, "No hay conexión a la base de datos."
        import uuid
        from datetime import datetime, timedelta
        
        # 1. Verificar si el usuario ya existe
        res_check = supabase.table("usuarios").select("username").eq("username", datos_usuario["username"]).execute()
        if res_check.data:
            return False, "El correo electrónico ya está registrado."
            
        # 2. Generar un empresa_id único
        nuevo_empresa_id = str(uuid.uuid4())
        
        # 3. Insertar el usuario con rol de Administrador
        accesos_totales = ["Pacientes", "Generar Orden", "Trabajos", "Ventas", "Inventario", "Contabilidad", "Usuarios", "Configuracion", "Inicio"]
        usuario_db = {
            "username": datos_usuario["username"],
            "password": datos_usuario["password"],
            "role": "Administrador",
            "nombre": datos_usuario["nombre"],
            "cargo": "Optometrista",
            "registro": "N/A",
            "telefono": datos_usuario["telefono"],
            "accesos": accesos_totales,
            "empresa_id": nuevo_empresa_id
        }
        supabase.table("usuarios").insert(usuario_db).execute()
        
        # 4. Crear la suscripción de prueba (15 días)
        fecha_prueba = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
        supabase.table("suscripciones").insert({
            "empresa_id": nuevo_empresa_id,
            "estado_pago": "Prueba",
            "fecha_vencimiento": fecha_prueba,
            "fecha_actualizacion": datetime.now().isoformat()
        }).execute()
        
        return True, "Cuenta creada exitosamente"
    except Exception as e:
        print(f"Error en crear_cuenta_saas: {e}")
        return False, f"Ocurrió un error en el servidor: {str(e)}"

# ══════════════════════════════════════════════════════════════
# PANEL SAAS MAESTRO (FASE 5)
# ══════════════════════════════════════════════════════════════
def cargar_todas_suscripciones_global():
    """Bypass de aislamiento: Lee TODAS las suscripciones y administradores de la plataforma."""
    try:
        if not supabase: return pd.DataFrame()
        
        # Obtenemos las suscripciones
        res_sub = supabase.table("suscripciones").select("*").execute()
        df_sub = pd.DataFrame(res_sub.data)
        
        # Obtenemos los usuarios administradores (para saber a qué óptica pertenece cada empresa_id)
        res_usr = supabase.table("usuarios").select("username, nombre, empresa_id, telefono").eq("role", "Administrador").execute()
        df_usr = pd.DataFrame(res_usr.data)
        
        if df_sub.empty:
            return pd.DataFrame()
            
        if not df_usr.empty:
            # Hacemos un merge (join) en python usando empresa_id
            df_merged = pd.merge(df_sub, df_usr, on="empresa_id", how="left")
            # Limpiamos y reordenamos columnas
            df_merged = df_merged.fillna("Desconocido")
            return df_merged
        
        return df_sub
    except Exception as e:
        print(f"Error cargando suscripciones globales: {e}")
        return pd.DataFrame()

def actualizar_suscripcion_manual(empresa_id: str, estado_pago: str, fecha_vencimiento: str) -> bool:
    """Actualización manual (Botón de Emergencia) de una suscripción."""
    try:
        if not supabase: return False
        from datetime import datetime
        
        res = supabase.table("suscripciones").update({
            "estado_pago": estado_pago,
            "fecha_vencimiento": fecha_vencimiento,
            "fecha_actualizacion": datetime.now().isoformat()
        }).eq("empresa_id", empresa_id).execute()
        
        return len(res.data) > 0
    except Exception as e:
        print(f"Error en actualizar_suscripcion_manual: {e}")
        return False
