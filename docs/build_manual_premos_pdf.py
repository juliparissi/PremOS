from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "PremOS_manual_implementacion_comercial.pdf"
LOGO = ROOT / "public" / "icon.png"


BLUE = colors.HexColor("#1F4D78")
DARK = colors.HexColor("#0B2545")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#E8EEF5")
SOFT = colors.HexColor("#F4F6F9")
CODE_BG = colors.HexColor("#0B1220")


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            "PremosTitle",
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=34,
            alignment=TA_CENTER,
            textColor=DARK,
            spaceAfter=4,
        )
    )
    base.add(
        ParagraphStyle(
            "PremosSubtitle",
            fontName="Helvetica",
            fontSize=13,
            leading=18,
            alignment=TA_CENTER,
            textColor=MUTED,
            spaceAfter=18,
        )
    )
    base.add(
        ParagraphStyle(
            "H1x",
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            textColor=BLUE,
            spaceBefore=14,
            spaceAfter=8,
            keepWithNext=True,
        )
    )
    base.add(
        ParagraphStyle(
            "H2x",
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=BLUE,
            spaceBefore=10,
            spaceAfter=5,
            keepWithNext=True,
        )
    )
    base.add(
        ParagraphStyle(
            "Bodyx",
            fontName="Helvetica",
            fontSize=9.6,
            leading=13,
            textColor=INK,
            spaceAfter=5,
        )
    )
    base.add(
        ParagraphStyle(
            "Smallx",
            fontName="Helvetica",
            fontSize=8.6,
            leading=11,
            textColor=MUTED,
            spaceAfter=4,
        )
    )
    base.add(
        ParagraphStyle(
            "CalloutTitle",
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=BLUE,
            spaceAfter=2,
        )
    )
    base.add(
        ParagraphStyle(
            "CalloutBody",
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=INK,
            spaceAfter=0,
        )
    )
    base.add(
        ParagraphStyle(
            "TableBody",
            fontName="Helvetica",
            fontSize=8.5,
            leading=10.5,
            textColor=INK,
            spaceAfter=0,
        )
    )
    base.add(
        ParagraphStyle(
            "TableHead",
            fontName="Helvetica-Bold",
            fontSize=8.7,
            leading=10.8,
            textColor=DARK,
            spaceAfter=0,
        )
    )
    return base


S = styles()


def para(text, style="Bodyx"):
    return Paragraph(text, S[style])


def title(text):
    return Paragraph(text, S["PremosTitle"])


def subtitle(text):
    return Paragraph(text, S["PremosSubtitle"])


def h1(text):
    return Paragraph(text, S["H1x"])


def h2(text):
    return Paragraph(text, S["H2x"])


def bullet_list(items):
    return ListFlowable(
        [ListItem(para(item), leftIndent=12) for item in items],
        bulletType="bullet",
        leftIndent=15,
        bulletFontName="Helvetica",
        bulletFontSize=8,
    )


def callout(title_text, body_text, fill=SOFT):
    data = [[para(title_text, "CalloutTitle")], [para(body_text, "CalloutBody")]]
    table = Table(data, colWidths=[16.1 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return [table, Spacer(1, 8)]


def code_block(text):
    pre = Preformatted(text.strip(), ParagraphStyle("Code", fontName="Courier", fontSize=7.7, leading=9.5, textColor=colors.white))
    table = Table([[pre]], colWidths=[16.1 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#1E293B")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return [table, Spacer(1, 8)]


def data_table(headers, rows, widths):
    data = [[para(h, "TableHead") for h in headers]]
    for row in rows:
        data.append([para(str(cell), "TableBody") for cell in row])
    table = Table(data, colWidths=[w * cm for w in widths], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return [table, Spacer(1, 8)]


def step(num, heading, body):
    return [
        para(f"<b>{num}. {heading}</b>", "Bodyx"),
        para(body, "Bodyx"),
    ]


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(letter[0] / 2, 0.45 * cm, f"PremOS - Manual de implementacion comercial | Pagina {doc.page}")
    canvas.restoreState()


def build():
    story = []
    if LOGO.exists():
        img = Image(str(LOGO), width=1.55 * cm, height=1.55 * cm)
        img.hAlign = "CENTER"
        story.extend([img, Spacer(1, 6)])
    story.extend([
        title("PremOS"),
        subtitle("Manual de implementacion comercial - Version operativa, Junio 2026"),
    ])
    story.extend(callout(
        "Objetivo del manual",
        "Estandarizar la instalacion de PremOS para nuevos clientes: preparar Supabase, configurar el VPS, activar licencia, dejar modulos correctos por plan y revisar rapido los problemas mas comunes.",
        colors.HexColor("#EEF6FF"),
    ))

    story.append(h1("1. Flujo comercial recomendado"))
    for block in [
        step(1, "Relevar el negocio", "Registrar rubro, productos, necesidades, dominio deseado, logo, datos fiscales y plan contratado."),
        step(2, "Crear entorno tecnico", "Preparar un proyecto Supabase por cliente y una carpeta/app separada en el VPS."),
        step(3, "Activar licencia", "Cargar el cliente en el panel administrador, asignar plan, estado, vencimiento y license_key."),
        step(4, "Configurar PremOS", "Cargar variables de entorno, compilar, iniciar con PM2 y conectar dominio/SSL."),
        step(5, "Validar y entregar", "Probar flujo completo y entregar URL, usuario temporal, plan activo y canal de soporte."),
    ]:
        story.extend(block)

    story.append(h1("2. Datos que pedir al cliente"))
    story.append(bullet_list([
        "Nombre comercial, razon social, CUIT, direccion, telefono y email.",
        "Logo en PNG o JPG.",
        "Lista inicial de productos, modelos, colores y precios de referencia.",
        "Suministros principales y unidades de medida.",
        "Proceso de produccion y recetas si contrata Full o Pro.",
        "Dominio o subdominio deseado, por ejemplo app.empresa.com.",
        "Plan contratado: Lite, Full o Pro.",
        "Necesita IA: si, no, o etapa futura.",
    ]))

    story.append(h1("3. Planes y modulos"))
    story.extend(data_table(
        ["Plan", "Modulos incluidos", "Uso recomendado"],
        [
            ["Lite", "Resumen, Clientes, Productos, Presupuestos, Ventas, Pedidos, Economia, Soporte, Configuracion", "Primera version para comercios que necesitan ordenar ventas, presupuestos y caja."],
            ["Full", "Todo Lite + Reportes, Lista de precios, Produccion, Nomina, Suministro y Stock", "Fabricas que necesitan controlar materias primas, personal, produccion, inventario y reportes."],
            ["Pro", "Todo Full + Asistente IA", "Clientes que quieren consultas asistidas y lectura rapida de indicadores del negocio."],
        ],
        [1.8, 8.4, 5.9],
    ))
    story.extend(callout("Regla comercial", "El plan real debe manejarse desde el panel administrador. En instalaciones con licencia, PremOS toma el plan desde el panel y no desde Configuracion local."))

    story.append(h1("4. Crear Supabase del cliente"))
    story.append(bullet_list([
        "Crear un proyecto nuevo de Supabase para el cliente.",
        "Guardar Project URL, anon/publishable key y service_role key.",
        "Ir a SQL Editor.",
        "Ejecutar el archivo supabase/premos_schema_instalacion.sql.",
        "Crear el usuario inicial en Authentication.",
        "Probar que el login ingrese a PremOS.",
    ]))
    story.extend(data_table(
        ["Tabla principal", "Para que se usa"],
        [
            ["clientes, productos, colores", "Base comercial para presupuestos, ventas y pedidos."],
            ["presupuestos, presupuesto_items", "Cotizaciones y detalle de productos cotizados."],
            ["pedidos, pedido_items, pagos_pedidos", "Seguimiento de pedidos y cobranzas."],
            ["movimientos_economia, movimientos_economia_abonos, proveedores", "Caja, salidas de dinero, pagos a proveedores y gastos."],
            ["nomina_empleados, nomina_movimientos", "Empleados, sueldos, adelantos e impacto automatico en Economia."],
            ["stock, suministros, movimientos_suministro", "Inventario comercial y materias primas."],
            ["produccion, produccion_items, recetas_produccion", "Ordenes de produccion, consumo de insumos y trazabilidad."],
            ["listas_precios, lista_precios_items", "Listas comerciales exportables a PDF o Excel."],
            ["configuracion_empresa, notas_rapidas", "Datos de empresa, PDF y notas del resumen."],
        ],
        [5.4, 10.7],
    ))

    story.append(h1("5. Variables de entorno de PremOS"))
    story.extend(code_block("""
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

OPENAI_API_KEY=

NEXT_PUBLIC_PREMOS_LICENSE_API_URL=https://admin.premoos.site/api/licencias
NEXT_PUBLIC_PREMOS_LICENSE_KEY=cliente_license_key
NEXT_PUBLIC_PREMOS_SUPPORT_API_URL=https://admin.premoos.site/api/soporte/tickets
"""))
    story.extend(callout(
        "Importante",
        "No subir nunca .env.local a GitHub. La anon/publishable key va en el frontend; la service_role key y OPENAI_API_KEY deben tratarse como privadas.",
        colors.HexColor("#FFF7ED"),
    ))

    story.append(PageBreak())
    story.append(h1("6. Instalacion desde Git en VPS"))
    story.extend(code_block("""
ssh -p5507 root@IP_DEL_VPS
cd /root
git clone git@github.com:juliparissi/PremOS.git cliente-premos
cd cliente-premos
npm install
npm run build
pm2 start npm --name cliente-premos -- start -- -H 0.0.0.0 -p 3002
pm2 save
"""))
    story.extend(callout("Puertos", "Usar un puerto distinto por entorno. Ejemplo: PremOS propio en 3000, demo en 3001, cliente nuevo en 3002."))

    story.append(h1("7. Actualizar un cliente existente"))
    story.extend(code_block("""
ssh -p5507 root@IP_DEL_VPS
cd /root/cliente-premos
git pull origin main
npm install
npm run build
pm2 restart cliente-premos
pm2 logs cliente-premos --lines 30
"""))

    story.append(h1("8. Nginx y SSL"))
    story.extend(code_block("""
sudo nano /etc/nginx/sites-available/cliente-premos

server {
    server_name app.empresa.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo ln -s /etc/nginx/sites-available/cliente-premos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d app.empresa.com
"""))

    story.append(h1("9. Panel administrador y licencias"))
    story.append(bullet_list([
        "Crear cliente en el panel admin.",
        "Asignar plan: Lite, Full o Pro.",
        "Asignar estado: Activo, Demo, Suspendido o Vencido.",
        "Definir vencimiento mensual.",
        "Copiar license_key al .env.local de PremOS del cliente.",
        "Verificar que el sistema muestre solo los modulos del plan.",
        "Si el cliente no paga, cambiar estado a Suspendido o dejar vencer la licencia.",
    ]))
    story.extend(data_table(
        ["Estado", "Efecto esperado"],
        [
            ["Activo", "El cliente puede usar el sistema normalmente."],
            ["Demo", "Permite mostrar el sistema por tiempo limitado."],
            ["Suspendido", "PremOS bloquea el acceso y muestra servicio suspendido."],
            ["Vencido", "PremOS bloquea el acceso cuando pasa la fecha de vencimiento."],
        ],
        [3.0, 13.1],
    ))

    story.append(h1("10. Soporte por tickets"))
    story.append(bullet_list([
        "El cliente crea tickets desde el modulo Soporte.",
        "El panel admin recibe tickets asociados al cliente por license_key.",
        "Responder desde el panel admin.",
        "El cliente puede continuar la conversacion hasta que el ticket se cierre.",
        "Los tickets cerrados deben limpiarse automaticamente luego de 72 horas segun la regla del panel.",
    ]))

    story.append(h1("11. Configuracion inicial dentro del sistema"))
    story.append(bullet_list([
        "Entrar con el usuario del cliente.",
        "Cargar datos de empresa en Configuracion.",
        "Subir logo de empresa para PDFs.",
        "Crear clientes, productos y colores iniciales.",
        "Cargar listas de precios si el plan lo permite.",
        "Cargar proveedores si usara Economia.",
        "Cargar empleados si usara Nomina.",
        "Cargar suministros y recetas si el plan incluye Produccion.",
        "Probar PDF de presupuesto, nota de venta y reportes.",
    ]))

    story.append(h1("12. Prueba final antes de entregar"))
    story.extend(data_table(
        ["Prueba", "Resultado esperado"],
        [
            ["Login", "El usuario accede y el plan muestra los modulos correctos."],
            ["Presupuesto", "Se crea, descarga PDF y puede pasar a pedido una sola vez."],
            ["Venta directa", "Crea pedido, no habilita PDF de presupuesto y registra seña si corresponde."],
            ["Pedido", "Permite registrar cobros desde el modal del pedido."],
            ["Economia", "Muestra ingresos desde ventas/pedidos y permite solo salidas de caja manuales."],
            ["Nomina", "Permite cargar empleados y cada pago genera una salida en Economia."],
            ["Produccion", "Descuenta suministros y permite eliminar produccion devolviendo insumos."],
            ["Reportes", "Muestra importes correctos y permite ocultar saldos."],
            ["Soporte", "Ticket enviado desde PremOS aparece en panel admin."],
        ],
        [3.8, 12.3],
    ))

    story.append(h1("13. Revisiones rapidas si algo falla"))
    story.extend(data_table(
        ["Problema", "Revision rapida"],
        [
            ["No abre el dominio", "Revisar DNS, firewall del cloud, Nginx, SSL y puerto PM2."],
            ["PM2 aparece en errored", "Ejecutar pm2 logs NOMBRE --lines 50 y revisar puerto ocupado o falta de .env."],
            ["Error EADDRINUSE", "Ese puerto ya esta en uso. Cambiar puerto o detener proceso duplicado."],
            ["No conecta Supabase", "Revisar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."],
            ["No funciona IA", "Revisar OPENAI_API_KEY y que el plan sea Pro si se vende como modulo activo."],
            ["No cambian modulos por plan", "Revisar NEXT_PUBLIC_PREMOS_LICENSE_API_URL y NEXT_PUBLIC_PREMOS_LICENSE_KEY."],
            ["No llegan tickets", "Revisar NEXT_PUBLIC_PREMOS_SUPPORT_API_URL y license_key del cliente."],
            ["PDF sale con datos viejos", "Revisar Configuracion de empresa y limpiar cache del navegador si corresponde."],
        ],
        [4.3, 11.8],
    ))

    story.append(h1("14. Comandos utiles"))
    story.extend(code_block("""
pm2 list
pm2 logs cliente-premos --lines 50
pm2 restart cliente-premos
pm2 stop cliente-premos
pm2 delete cliente-premos
pm2 save

sudo nginx -t
sudo systemctl reload nginx

git status
git pull origin main
npm run build
"""))

    story.append(h1("15. Checklist de entrega"))
    story.append(bullet_list([
        "URL final funcionando con HTTPS.",
        "Usuario y contrasena temporal entregados.",
        "Datos de empresa cargados.",
        "Plan y vencimiento confirmados en panel admin.",
        "Licencia activa probada.",
        "Soporte por tickets probado.",
        "Backups y renovacion mensual registrados.",
        "Cliente informado sobre alcance del plan contratado.",
    ]))

    story.append(h1("16. Politica operativa recomendada"))
    story.append(para(
        "Para la primera etapa comercial, conviene mantener una instalacion separada por cliente: un proyecto Supabase por cliente y una app PM2 independiente. "
        "Esto simplifica privacidad, soporte, bloqueo por falta de pago y migraciones. Mas adelante, cuando el volumen lo justifique, se puede evolucionar hacia un esquema multi-tenant o infraestructura dedicada."
    ))

    story.append(h1("17. Habilitar u ocultar modulos"))
    story.append(para(
        "Los modulos visibles por plan se controlan desde el archivo lib/planes.ts. "
        "Si el panel administrador esta activo, el cliente recibe su plan desde la licencia; PremOS toma ese plan y muestra solo los modulos permitidos."
    ))
    story.extend(data_table(
        ["Archivo / bloque", "Que tocar"],
        [
            ["PremosModule", "Agregar el identificador interno del modulo, por ejemplo nomina."],
            ["planModules", "Agregar o quitar el modulo dentro de lite, full o pro."],
            ["routeModules", "Vincular la ruta del modulo con su identificador, por ejemplo /nomina -> nomina."],
            ["app/layout.tsx", "Solo revisar si el modulo no aparece en la barra lateral o si necesita etiqueta especial."],
            ["Panel admin", "Cambiar el plan del cliente. No hace falta tocar PremOS para pasar de Lite a Full o Pro."],
        ],
        [4.1, 12.0],
    ))
    story.extend(code_block("""
# 1. Editar el archivo de planes
lib/planes.ts

# 2. Validar que compile
npm run build

# 3. Subir a GitHub
git status
git add lib/planes.ts
git commit -m "chore: ajustar modulos por plan"
git push origin main

# 4. Actualizar el VPS del cliente
ssh -p5507 root@IP_DEL_VPS
cd /root/cliente-premos
git pull origin main
npm install
npm run build
pm2 restart cliente-premos
"""))
    story.extend(callout(
        "Regla simple",
        "Para ocultar un modulo a un plan, quitarlo del array correspondiente en planModules. Para habilitarlo, agregarlo. Si el modulo tiene ruta propia, tambien debe existir en routeModules.",
        colors.HexColor("#EEF6FF"),
    ))

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        rightMargin=0.75 * cm,
        leftMargin=0.75 * cm,
        topMargin=0.85 * cm,
        bottomMargin=0.85 * cm,
    )
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT)


if __name__ == "__main__":
    build()
