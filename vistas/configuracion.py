import streamlit as st
import pandas as pd
from database import cargar_sucursales, guardar_sucursal, eliminar_sucursal, cargar_auditoria, obtener_resumen_dia

def render_configuracion():
    st.title("⚙️ Configuración del Sistema")
    
    if "suc_msg" in st.session_state:
        st.toast(st.session_state.pop("suc_msg"))

    tabs_names = ["🏢 Gestión de Sedes", "👤 Mi Perfil"]
    is_admin = st.session_state.get("user_role") == "Administrador"
    if is_admin:
        tabs_names.append("📋 Auditoría")

    st_tabs = st.tabs(tabs_names)
    tab1 = st_tabs[0]
    tab2 = st_tabs[1]
    
    with tab1:
        st.subheader("Locales y Sucursales")
        st.info("Aquí puedes definir las direcciones y teléfonos de cada local para que aparezcan en los certificados PDF.")
        
        df_suc = cargar_sucursales()
        
        with st.expander("➕ Añadir Nueva Sede", expanded=False):
            with st.form("form_nueva_sede", clear_on_submit=True):
                c1, c2 = st.columns(2)
                n_nombre = c1.text_input("Nombre de la Sede", placeholder="Ej: Sucursal Centro")
                n_ciudad = c2.text_input("Ciudad", value="Quito")
                n_direccion = st.text_input("Dirección Exacta", placeholder="Av. Principal y Calle Secundaria")
                n_telefono = st.text_input("Teléfono de la Sede", placeholder="02-XXXX-XXX")
                
                if st.form_submit_button("💾 Guardar Sede", type="primary"):
                    if n_nombre and n_direccion:
                        success, msg = guardar_sucursal({
                            "nombre": n_nombre,
                            "direccion": n_direccion,
                            "telefono": n_telefono,
                            "ciudad": n_ciudad
                        })
                        if success:
                            st.session_state["suc_msg"] = f"✅ Sede '{n_nombre}' guardada correctamente."
                            st.rerun()
                        else:
                            st.error(f"❌ Error al guardar: {msg}")
                    else:
                        st.error("Nombre y Dirección son obligatorios.")

        if not df_suc.empty:
            for _, row in df_suc.iterrows():
                with st.container():
                    st.markdown(f"""
                    <div style='background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 10px;'>
                        <h4 style='margin:0; color:#1e293b;'>🏢 {row['nombre']}</h4>
                        <p style='margin:5px 0; font-size:14px; color:#64748b;'>📍 {row['direccion']} — {row['ciudad']}</p>
                        <p style='margin:0; font-size:13px; color:#94a3b8;'>📞 {row.get('telefono', 'N/A')}</p>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    c1, c2, c3 = st.columns([3, 1, 1])
                    with c2:
                        with st.popover("✏️ Editar"):
                            with st.form(f"edit_suc_{row['id']}"):
                                e_nombre = st.text_input("Nombre", value=row['nombre'])
                                e_ciudad = st.text_input("Ciudad", value=row.get('ciudad', 'Quito'))
                                e_direccion = st.text_input("Dirección", value=row['direccion'])
                                e_telefono = st.text_input("Teléfono", value=row.get('telefono', ''))
                                
                                if st.form_submit_button("Actualizar"):
                                    success, msg = guardar_sucursal({
                                        "id": row['id'],
                                        "nombre": e_nombre,
                                        "direccion": e_direccion,
                                        "telefono": e_telefono,
                                        "ciudad": e_ciudad
                                    })
                                    if success:
                                        st.session_state["suc_msg"] = f"✅ Sede '{e_nombre}' actualizada con éxito."
                                        st.rerun()
                                    else:
                                        st.error(f"❌ Error: {msg}")
                    with c3:
                        if st.button("🗑️ Eliminar", key=f"del_suc_{row['id']}", use_container_width=True):
                            eliminar_sucursal(row['id'])
                            st.success("Sede eliminada.")
                            st.rerun()
        else:
            st.warning("No hay sedes registradas. Por favor añade la 'Matriz' primero.")

    with tab2:
        st.subheader("Información del Usuario")
        st.write(f"**Usuario:** {st.session_state.get('user_login')}")
        st.write(f"**Nombre:** {st.session_state.get('user_name')}")
        st.write(f"**Rol:** {st.session_state.get('user_role')}")
        st.write(f"**Cargo:** {st.session_state.get('user_cargo')}")
        
        st.markdown("---")
        st.subheader("✍️ Mi Firma Digital")
        st.info("Tu firma aparecerá automáticamente al pie de los certificados visuales que generes.")
        
        # Mostrar firma actual si existe
        user_login = st.session_state.get("user_login", "")
        firma_actual_b64 = st.session_state.get("user_firma", "")
        
        if firma_actual_b64:
            import base64 as _b64
            try:
                firma_bytes_display = _b64.b64decode(firma_actual_b64)
                st.image(firma_bytes_display, caption="Firma actual", width=200)
            except Exception:
                st.caption("(No se pudo previsualizar la firma actual)")
        else:
            st.caption("🖊️ Aún no tienes una firma subida.")
        
        # Formulario de subida de firma
        with st.form("form_firma_perfil", clear_on_submit=True):
            nueva_firma = st.file_uploader(
                "Sube tu firma (PNG con fondo transparente recomendado)",
                type=["png", "jpg", "jpeg"],
                help="El archivo debe ser una imagen de tu firma. Fondo blanco o transparente."
            )
            if st.form_submit_button("💾 Guardar Mi Firma", type="primary"):
                if nueva_firma:
                    import base64 as _b64
                    firma_bytes = nueva_firma.getvalue()
                    firma_b64 = _b64.b64encode(firma_bytes).decode("utf-8")
                    
                    # Guardar localmente
                    firma_local = f"firma_{user_login}.png"
                    with open(firma_local, "wb") as f:
                        f.write(firma_bytes)
                    
                    # Guardar en Supabase
                    try:
                        from database import supabase
                        if supabase:
                            supabase.table("usuarios").update(
                                {"firma_base64": firma_b64}
                            ).eq("username", user_login).execute()
                            st.session_state.user_firma = firma_b64
                            st.success("✅ Firma guardada exitosamente. Aparecerá en tus próximos certificados.")
                            st.rerun()
                        else:
                            st.error("Sin conexión a la base de datos.")
                    except Exception as e:
                        st.error(f"Error al guardar la firma: {e}")
                else:
                    st.warning("Por favor selecciona un archivo de firma.")


    if is_admin:
        with st_tabs[2]:
            st.subheader("📋 Registro de Auditoría")
            tabs_admin = st.tabs(["📊 Auditoría de Cambios", "👤 Control de Sesiones"])
            
            with tabs_admin[0]:
                st.info("Registro inmutable de cambios en Pacientes, Historias, Inventario y Laboratorio.")
                
                # RESUMEN CONTABLE GLOBAL (TODAS LAS SEDES)
                df_s = cargar_sucursales()
                sedes = df_s["nombre"].tolist() if not df_s.empty else ["Matriz"]
                hoy = pd.Timestamp.now().strftime("%Y-%m-%d")
                
                t_ventas = 0
                t_gastos = 0
                for s in sedes:
                    res = obtener_resumen_dia(s, hoy)
                    t_ventas += (res["Efectivo"] + res["Tarjeta"] + res["Transferencia"])
                    t_gastos += res["Gastos"]
                
                c_m1, c_m2, c_m3 = st.columns(3)
                c_m1.metric("💰 Ventas Globales (Hoy)", f"${t_ventas:.2f}")
                c_m2.metric("📉 Gastos Globales (Hoy)", f"${t_gastos:.2f}")
                c_m3.metric("📈 Utilidad Bruta", f"${t_ventas - t_gastos:.2f}")
                st.markdown("---")
                
                df_auditoria = cargar_auditoria(limit=2000)
                if not df_auditoria.empty:
                    # Filtrar para NO mostrar seguridad aquí
                    df_cambios = df_auditoria[df_auditoria["entidad"] != "Seguridad"]
                    
                    if "fecha_hora" in df_cambios.columns:
                        df_cambios["fecha_hora"] = pd.to_datetime(df_cambios["fecha_hora"]).dt.strftime("%Y-%m-%d %H:%M:%S")
                    
                    c1, c2 = st.columns(2)
                    filtro_usr = c1.selectbox("Filtrar por Usuario", ["Todos"] + df_cambios["usuario"].unique().tolist(), key="f_usr_aud")
                    filtro_acc = c2.selectbox("Filtrar por Acción", ["Todas"] + df_cambios["accion"].unique().tolist(), key="f_acc_aud")
                    
                    df_view = df_cambios.copy()
                    if filtro_usr != "Todos": df_view = df_view[df_view["usuario"] == filtro_usr]
                    if filtro_acc != "Todas": df_view = df_view[df_view["accion"] == filtro_acc]
                    
                    st.dataframe(df_view[["fecha_hora", "nombre_usuario", "accion", "entidad", "detalle", "sucursal"]], use_container_width=True, hide_index=True)
                else:
                    st.warning("No hay registros de cambios.")

            with tabs_admin[1]:
                st.info("Registro de accesos al sistema (Inicios de sesión, salidas e intentos fallidos).")
                if not df_auditoria.empty:
                    # Filtrar para mostrar SOLO seguridad aquí
                    df_sesiones = df_auditoria[df_auditoria["entidad"] == "Seguridad"]
                    
                    if "fecha_hora" in df_sesiones.columns:
                        df_sesiones["fecha_hora"] = pd.to_datetime(df_sesiones["fecha_hora"]).dt.strftime("%Y-%m-%d %H:%M:%S")
                    
                    st.dataframe(df_sesiones[["fecha_hora", "usuario", "accion", "detalle", "sucursal"]], use_container_width=True, hide_index=True)
                else:
                    st.warning("No hay registros de sesiones.")
