import streamlit as st
import pandas as pd
from datetime import datetime
from database import cargar_todas_citas, guardar_cita, eliminar_cita

def render_citas():
    st.markdown("""
        <div class="page-header">
            <h1 style='margin:0; color:#1e293b;'>📅 Agendamiento de Citas</h1>
            <p style='margin:5px 0 0 0; color:#64748b;'>Gestión interna de citas para optometría</p>
        </div>
    """, unsafe_allow_html=True)

    sucursal = st.session_state.get("sucursal_activa", "Matriz")
    
    # Formularios para Nueva Cita
    with st.expander("➕ Agendar Nueva Cita", expanded=False):
        with st.form("form_nueva_cita"):
            c1, c2 = st.columns(2)
            fecha = c1.date_input("Fecha de la Cita")
            hora = c2.time_input("Hora de la Cita")
            
            # Obtener profesionales de la base de datos
            opciones_prof = [st.session_state.get("user_name", "")]
            try:
                from database import supabase
                if supabase:
                    res = supabase.table("usuarios").select("nombre, cargo").execute()
                    if res.data:
                        prof_validos = ["optometrista", "oftalmólogo", "oftalmologo", "profesional", "médico", "medico"]
                        filtrados = [u["nombre"] for u in res.data if str(u.get("cargo", "")).lower() in prof_validos]
                        if filtrados:
                            opciones_prof = list(set(filtrados))
            except Exception:
                pass
                
            curr_usr = st.session_state.get("user_name", "")
            if curr_usr and curr_usr not in opciones_prof:
                opciones_prof.insert(0, curr_usr)

            c3, c4, c5 = st.columns([2, 1.5, 1.5])
            paciente = c3.text_input("Nombre del Paciente")
            telefono = c4.text_input("Teléfono (Opcional)")
            correo = c5.text_input("Correo (Opcional)")
            
            c6, c7 = st.columns([2, 1])
            motivo = c6.text_input("Motivo de la Cita")
            optometrista = c7.selectbox("Profesional Asignado", options=opciones_prof)
            
            submit = st.form_submit_button("Agendar Cita", type="primary")
            
            if submit:
                if not paciente:
                    st.error("El nombre del paciente es obligatorio.")
                else:
                    nueva_cita = {
                        "fecha": fecha.strftime("%Y-%m-%d"),
                        "hora": hora.strftime("%H:%M:%S"),
                        "paciente_nombre": paciente,
                        "telefono": telefono,
                        "correo": correo,
                        "motivo": motivo,
                        "optometrista": optometrista,
                        "sucursal": sucursal,
                        "estado": "Pendiente"
                    }
                    guardar_cita(nueva_cita)
                    st.success("Cita agendada correctamente.")
                    st.rerun()
                    
    st.divider()
    
    # Visualización de Citas
    st.subheader("📋 Citas Agendadas")
    df_citas = cargar_todas_citas(sucursal)
    
    if not df_citas.empty:
        # Filtrar citas
        filtro_estado = st.selectbox("Filtrar por estado", ["Todas", "Pendiente", "Atendido", "Cancelado"])
        if filtro_estado != "Todas":
            df_mostrar = df_citas[df_citas["estado"] == filtro_estado]
        else:
            df_mostrar = df_citas
            
        if not df_mostrar.empty:
            for idx, cita in df_mostrar.iterrows():
                estado_color = "green" if cita["estado"] == "Atendido" else "red" if cita["estado"] == "Cancelado" else "orange"
                st.markdown(f"### {cita['hora']} - {cita['paciente_nombre']}")
                st.markdown(f"**Fecha:** {cita['fecha']} | **Profesional:** {cita.get('optometrista', '')} | **Estado:** <span style='color:{estado_color}'>{cita['estado']}</span>", unsafe_allow_html=True)
                st.write(f"**Motivo:** {cita.get('motivo', 'N/A')} | **Teléfono:** {cita.get('telefono', 'N/A')} | **Correo:** {cita.get('correo', 'N/A')}")
                
                c1, c2, c3 = st.columns([1, 1, 4])
                if cita["estado"] == "Pendiente":
                    if c1.button("✅ Atendido", key=f"atender_{cita['id']}"):
                        cita_update = cita.to_dict()
                        cita_update["estado"] = "Atendido"
                        guardar_cita(cita_update)
                        st.rerun()
                    if c2.button("❌ Cancelar", key=f"cancelar_{cita['id']}"):
                        cita_update = cita.to_dict()
                        cita_update["estado"] = "Cancelado"
                        guardar_cita(cita_update)
                        st.rerun()
                st.divider()
        else:
            st.info(f"No hay citas con el estado: {filtro_estado}")
    else:
        st.info("No hay citas registradas en esta sucursal.")
