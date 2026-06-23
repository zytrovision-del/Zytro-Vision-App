import re

def patch_file():
    with open('app.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # The new marketing and layout
    marketing_block = """    # ── LAYOUT DE LOGIN Y MARKETING ───────────────────────────
    # Bloque de Marketing Comercial
    st.markdown('''
    <div style="background-color: rgba(15, 23, 42, 0.7); padding: 40px; border-radius: 15px; text-align: center; margin-bottom: 30px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <h1 style="color: white; font-weight: 800; font-size: 2.5rem; margin-bottom: 10px;">👁️ ZytroVision · Plataforma de Gestión Integral para Ópticas</h1>
        <p style="color: #cbd5e1; font-size: 1.1rem; max-width: 800px; margin: 0 auto;">El sistema en la nube más completo para automatizar tu clínica, laboratorio e inventario en un solo lugar.</p>
    </div>
    ''', unsafe_allow_html=True)
    
    col_m1, col_m2, col_m3 = st.columns(3)
    
    with col_m1:
        st.markdown('''
        <div style="background-color: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 12px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.05);">
            <h3 style="color: #60a5fa; margin-bottom: 15px;">👥 Gestión Clínica</h3>
            <p style="color: #e2e8f0; font-size: 0.95rem;">Historias completas, recetas, optometría y agenda de citas.</p>
        </div>
        ''', unsafe_allow_html=True)
        
    with col_m2:
        st.markdown('''
        <div style="background-color: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 12px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.05);">
            <h3 style="color: #f472b6; margin-bottom: 15px;">📦 Inventario y Lab</h3>
            <p style="color: #e2e8f0; font-size: 0.95rem;">Control de stock de monturas, lunas y seguimiento de trabajos.</p>
        </div>
        ''', unsafe_allow_html=True)
        
    with col_m3:
        st.markdown('''
        <div style="background-color: rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 12px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.05);">
            <h3 style="color: #34d399; margin-bottom: 15px;">🧾 Facturación POS</h3>
            <p style="color: #e2e8f0; font-size: 0.95rem;">Cierres de caja diarios y reportes de contabilidad precisos.</p>
        </div>
        ''', unsafe_allow_html=True)
        
    st.markdown("<hr style='border: 1px solid rgba(255,255,255,0.1); margin: 40px 0;'>", unsafe_allow_html=True)

    _, centered_col, _ = st.columns([1, 1.2, 1])

    with centered_col:
        tab_login, tab_registro = st.tabs(["🔐 Iniciar Sesión", "🚀 Crear Cuenta (Prueba Gratis)"])
        
        with tab_login:
            st.markdown('<div class="login-wrapper">', unsafe_allow_html=True)"""
    
    # 1. Replace the top part
    target_top = """    # ── LAYOUT DE LOGIN ──────────────────────────────────────
    _, centered_col, _ = st.columns([1, 1.2, 1])

    with centered_col:
        st.markdown('<div class="login-wrapper">', unsafe_allow_html=True)"""
    
    content = content.replace(target_top, marketing_block)
    
    # 2. Indent the entire block inside "with tab_login:"
    # That block goes from `# Carga de Logo en Base64` to `st.markdown('</div>', unsafe_allow_html=True)` (the second one)
    target_body_start = "        # Carga de Logo en Base64"
    target_body_end = "            st.markdown('</div>', unsafe_allow_html=True)\n\n    st.stop()"
    
    idx_start = content.find(target_body_start)
    idx_end = content.find("    st.stop()", idx_start)
    
    if idx_start != -1 and idx_end != -1:
        body_to_indent = content[idx_start:idx_end]
        indented_body = "\n".join(["    " + line if line else line for line in body_to_indent.split("\n")])
        
        # Add the tab_registro logic at the end
        registro_logic = """
        with tab_registro:
            st.markdown('<div class="login-wrapper">', unsafe_allow_html=True)
            st.markdown('''
                <div class="glass-card" style="height: auto !important; padding: 20px !important;">
                    <h3 style="color: white; margin-bottom: 5px;">🚀 Crea tu Clínica Virtual</h3>
                    <p style="color: #cbd5e1; font-size: 0.9rem; margin-bottom: 15px;">15 días gratis, sin tarjeta de crédito.</p>
            ''', unsafe_allow_html=True)
            
            with st.form("registro_saas_form", border=False):
                r_optica = st.text_input("Nombre de la Óptica / Clínica *")
                r_nombre = st.text_input("Nombre Completo del Administrador *")
                r_email = st.text_input("Correo Electrónico (Tu Usuario) *")
                r_telefono = st.text_input("Teléfono de Contacto")
                r_pass1 = st.text_input("Contraseña *", type="password")
                r_pass2 = st.text_input("Confirmar Contraseña *", type="password")
                
                submit_registro = st.form_submit_button("Registrar mi Óptica y Comenzar", type="primary")
                
                if submit_registro:
                    if not r_optica or not r_nombre or not r_email or not r_pass1:
                        st.error("Por favor completa todos los campos obligatorios (*).")
                    elif r_pass1 != r_pass2:
                        st.error("Las contraseñas no coinciden.")
                    else:
                        from database import crear_cuenta_saas
                        datos_nuevos = {
                            "username": r_email.strip().lower(),
                            "password": r_pass1,
                            "nombre": r_nombre.strip(),
                            "telefono": r_telefono.strip()
                        }
                        exito, mensaje = crear_cuenta_saas(datos_nuevos)
                        
                        if exito:
                            st.success("✅ " + mensaje)
                            # Auto login
                            st.session_state.logged_in = True
                            st.session_state.user_role = "Administrador"
                            st.session_state.user_name = datos_nuevos["nombre"]
                            st.session_state.user_login = datos_nuevos["username"]
                            st.session_state.user_cargo = "Optometrista"
                            st.session_state.user_registro = "N/A"
                            st.session_state.user_telefono = datos_nuevos["telefono"]
                            st.session_state.user_firma = ""
                            st.session_state.user_accesos = ["Pacientes", "Generar Orden", "Trabajos", "Ventas", "Inventario", "Contabilidad", "Usuarios", "Configuracion", "Inicio"]
                            usrs = _cargar_usuarios()
                            if datos_nuevos["username"] in usrs:
                                st.session_state.empresa_id = usrs[datos_nuevos["username"]].get("empresa_id")
                            
                            st.session_state.sucursales_asignadas = ["Matriz"]
                            st.session_state.sucursal_activa = "Matriz"
                            
                            st.rerun()
                        else:
                            st.error(f"❌ Error: {mensaje}")
                            
            st.markdown('</div>', unsafe_allow_html=True)
            st.markdown('</div>', unsafe_allow_html=True)\n\n"""
        
        content = content[:idx_start] + indented_body + registro_logic + content[idx_end:]
        
    with open('app.py', 'w', encoding='utf-8') as f:
        f.write(content)
        
if __name__ == "__main__":
    patch_file()
    print("Done")
