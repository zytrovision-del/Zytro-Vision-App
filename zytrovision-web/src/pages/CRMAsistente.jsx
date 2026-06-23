import React from 'react';
import { Bot, MessageSquare, AlertCircle, Clock, Zap } from 'lucide-react';
import '../index.css';

export default function CRMAsistente() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <Bot size={36} color="#fbbf24" />
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>Zytro-Bot (Asistente de IA)</h1>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Inteligencia Artificial para potenciar tu óptica.</p>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'rgba(251, 191, 36, 0.1)', 
        border: '1px solid rgba(251, 191, 36, 0.3)', 
        padding: '20px', 
        borderRadius: '12px', 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '15px',
        marginBottom: '30px'
      }}>
        <AlertCircle size={24} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ color: '#fbbf24', margin: '0 0 8px 0' }}>Módulo en Mantenimiento Programado</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>
            El asistente Zytro-Bot está <strong>desactivado temporalmente</strong>. Estamos trabajando en una actualización mayor para integrar modelos de lenguaje más rápidos y precisos en la nueva arquitectura de React. Pronto podrás volver a utilizarlo para analizar diagnósticos y redactar correos automáticos.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        <div className="glass-panel" style={{ padding: '30px', opacity: 0.6, pointerEvents: 'none' }}>
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={20} color="#60a5fa" /> Consultas Clínicas Rápidas
          </h3>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', marginBottom: '15px', minHeight: '150px' }}>
            <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '50px' }}>El chat de IA estará disponible aquí.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input className="input-field" disabled placeholder="Escribe tu consulta médica..." style={{ margin: 0, flex: 1 }} />
            <button className="btn-primary" disabled style={{ opacity: 0.5 }}>Enviar</button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '30px', opacity: 0.6, pointerEvents: 'none' }}>
          <h3 style={{ color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={20} color="#a855f7" /> Remarketing Automático (CRM)
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Generación de mensajes de WhatsApp para pacientes que no han vuelto en más de 1 año.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ border: '1px solid var(--border-light)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>Juan Pérez</span>
                <span style={{ color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14}/> Última visita: Hace 14 meses</span>
              </div>
              <button className="btn-secondary" disabled style={{ width: '100%', opacity: 0.5 }}>Generar Mensaje con IA</button>
            </div>
            
            <div style={{ border: '1px solid var(--border-light)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>María Gómez</span>
                <span style={{ color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14}/> Última visita: Hace 18 meses</span>
              </div>
              <button className="btn-secondary" disabled style={{ width: '100%', opacity: 0.5 }}>Generar Mensaje con IA</button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
