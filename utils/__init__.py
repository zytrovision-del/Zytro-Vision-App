"""
utils/__init__.py — Punto de entrada del paquete utils
"""

# WhatsApp
from .whatsapp import (
    wa_link,
    generar_msg_factura,
    generar_msg_hc,
    generar_msg_indicaciones,
)

# PDF
from .pdf import (
    _s,
    generar_pdf_historia,
    generar_pdf_ticket,
    generar_pdf_venta,
)

__all__ = [
    "wa_link",
    "generar_msg_factura",
    "generar_msg_hc",
    "generar_msg_indicaciones",
    "_s",
    "generar_pdf_historia",
    "generar_pdf_ticket",
]
