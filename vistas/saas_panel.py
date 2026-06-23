import streamlit as st
import pandas as pd
from datetime import datetime

def render_saas_panel():
    st.markdown("""
    <div style="background-color: rgba(15, 23, 42, 0.8); padding: 25px; border-radius: 15px; border: 1px solid rgba(255, 215, 0, 0.3); margin-bottom: 30px;">
        <h1 style="color: #ffd700; margin: 0;">👑 Panel SaaS Maestro</h1>
        <p style="color: #cbd5e1; margin-top: 5px; font-size: 1.1rem;">Centro de Comando General de ZytroVision. Solo accesible para Super Administrador.</p>
    </div>
    """, unsafe_allow_html=True)
    
    from database import cargar_todas_suscripciones_global, actualizar_suscripcion_manual
    
    # 1. Cargar datos
    with st.spinner("Cargando métricas globales..."):
        df = cargar_todas_suscripciones_global()
        
    if df.empty:
        st.warning("No hay clínicas registradas o hubo un error al cargar los datos.")
        return
        
    # 2. Cálculos para métricas
    total_clinicas = len(df)
    activas = len(df[df["estado_pago"] == "Activo"])
    en_prueba = len(df[df["estado_pago"] == "Prueba"])
    vencidas = len(df[df["estado_pago"] == "Vencido"])
    
    mrr = activas * 50.00
    
    # 3. Mostrar Métricas Ejecutivas
    st.markdown("### 📊 Métricas de Negocio (MRR)")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Ópticas", total_clinicas)
    with col2:
        st.metric("Suscripciones Activas", activas)
    with col3:
        st.metric("Suscripciones en Prueba", en_prueba)
    with col4:
        st.metric("MRR Estimado", f"${mrr:,.2f}")
        
    st.markdown("<hr style='border: 1px solid rgba(255,255,255,0.1);'>", unsafe_allow_html=True)
    
    # 4. Tabla de Monitoreo
    st.markdown("### 🏢 Monitoreo de Clientes")
    
    # Preparar DataFrame para visualización limpia
    df_mostrar = df.copy()
    if "nombre" in df_mostrar.columns:
        df_mostrar = df_mostrar[["empresa_id", "nombre", "username", "telefono", "estado_pago", "fecha_vencimiento", "fecha_actualizacion"]]
        df_mostrar.columns = ["ID Empresa", "Nombre Admin/Clínica", "Email", "Teléfono", "Estado Pago", "Vencimiento", "Última Actualización"]
    
    st.dataframe(df_mostrar, use_container_width=True, hide_index=True)
    
    st.markdown("<hr style='border: 1px solid rgba(255,255,255,0.1);'>", unsafe_allow_html=True)
    
    # 5. Botón de Emergencia (Anulación Manual)
    st.markdown("### 🚨 Panel de Anulación Manual (Botón de Emergencia)")
    st.info("Utiliza esta herramienta si te pagaron en efectivo, por transferencia o si necesitas regalar días adicionales a un cliente.")
    
    with st.form("manual_override_form"):
        col_id, col_estado, col_fecha = st.columns(3)
        with col_id:
            emp_id = st.text_input("ID Empresa (Copiar de la tabla)")
        with col_estado:
            nuevo_estado = st.selectbox("Nuevo Estado", ["Activo", "Vencido", "Prueba"])
        with col_fecha:
            nueva_fecha = st.date_input("Nueva Fecha de Vencimiento", value=datetime.now())
            
        submit_btn = st.form_submit_button("Actualizar Cliente Manualmente", type="primary")
        
        if submit_btn:
            if not emp_id.strip():
                st.error("Debes ingresar el ID de la Empresa.")
            else:
                fecha_str = nueva_fecha.strftime("%Y-%m-%d")
                exito = actualizar_suscripcion_manual(emp_id.strip(), nuevo_estado, fecha_str)
                if exito:
                    st.success(f"✅ ¡Suscripción de '{emp_id}' actualizada a {nuevo_estado} hasta {fecha_str}!")
                    st.rerun()
                else:
                    st.error("❌ Error al actualizar. Verifica que el ID de la Empresa sea correcto.")
