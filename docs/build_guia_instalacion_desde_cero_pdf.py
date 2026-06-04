from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
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
OUT = ROOT / "docs" / "PremOS_guia_instalacion_desde_cero.pdf"
LOGO = ROOT / "public" / "icon.png"

DARK = colors.HexColor("#0B2545")
BLUE = colors.HexColor("#1F4D78")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#E8EEF5")
SOFT = colors.HexColor("#F4F6F9")
WARN = colors.HexColor("#FFF7ED")
CODE_BG = colors.HexColor("#0B1220")


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            "TitleX",
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=30,
            alignment=TA_CENTER,
            textColor=DARK,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            "SubtitleX",
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=MUTED,
            spaceAfter=14,
        )
    )
    styles.add(
        ParagraphStyle(
            "H1X",
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=BLUE,
            spaceBefore=12,
            spaceAfter=7,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            "H2X",
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=BLUE,
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            "BodyX",
            fontName="Helvetica",
            fontSize=9.2,
            leading=12.2,
            textColor=INK,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            "SmallX",
            fontName="Helvetica",
            fontSize=8.2,
            leading=10.5,
            textColor=MUTED,
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            "TableHeadX",
            fontName="Helvetica-Bold",
            fontSize=8.3,
            leading=10.2,
            textColor=DARK,
        )
    )
    styles.add(
        ParagraphStyle(
            "TableBodyX",
            fontName="Helvetica",
            fontSize=8.1,
            leading=10,
            textColor=INK,
        )
    )
    styles.add(
        ParagraphStyle(
            "CalloutTitleX",
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11.5,
            textColor=BLUE,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            "CalloutBodyX",
            fontName="Helvetica",
            fontSize=8.6,
            leading=11.2,
            textColor=INK,
        )
    )
    return styles


S = build_styles()


def p(text, style="BodyX"):
    return Paragraph(text, S[style])


def h1(text):
    return Paragraph(text, S["H1X"])


def h2(text):
    return Paragraph(text, S["H2X"])


def code(text):
    block = Preformatted(
        text.strip(),
        ParagraphStyle(
            "CodeX",
            fontName="Courier",
            fontSize=7.2,
            leading=9.1,
            textColor=colors.white,
        ),
    )
    table = Table([[block]], colWidths=[16.2 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
                ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#1E293B")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return [table, Spacer(1, 6)]


def bullets(items):
    return ListFlowable(
        [ListItem(p(item), leftIndent=10) for item in items],
        bulletType="bullet",
        leftIndent=14,
        bulletFontName="Helvetica",
        bulletFontSize=8,
    )


def callout(title, body, fill=SOFT):
    table = Table(
        [[p(title, "CalloutTitleX")], [p(body, "CalloutBodyX")]],
        colWidths=[16.2 * cm],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return [table, Spacer(1, 6)]


def data_table(headers, rows, widths_cm):
    data = [[p(header, "TableHeadX") for header in headers]]
    for row in rows:
        data.append([p(str(cell), "TableBodyX") for cell in row])
    table = Table(data, colWidths=[width * cm for width in widths_cm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return [table, Spacer(1, 6)]


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(
        letter[0] / 2,
        0.42 * cm,
        f"PremOS - Guia de instalacion desde cero | Pagina {doc.page}",
    )
    canvas.restoreState()


def build():
    story = []

    if LOGO.exists():
        logo = Image(str(LOGO), width=1.3 * cm, height=1.3 * cm)
        logo.hAlign = "CENTER"
        story.extend([logo, Spacer(1, 5)])

    story.extend(
        [
            Paragraph("PremOS", S["TitleX"]),
            Paragraph("Guia de instalacion desde cero para cliente o demo", S["SubtitleX"]),
        ]
    )

    story.extend(
        callout(
            "Objetivo",
            "Seguir estos pasos para instalar PremOS desde cero en un VPS: clonar el repo, configurar Supabase, compilar, levantar con PM2, conectar dominio con Nginx y activar SSL. El panel admin se instala igual, usando otro repo, otro puerto y otro dominio/subdominio.",
            colors.HexColor("#EEF6FF"),
        )
    )

    story.append(h1("0. Datos necesarios antes de empezar"))
    story.append(
        bullets(
            [
                "IP del VPS, usuario root y puerto SSH.",
                "Dominio o subdominio ya creado en DNS, por ejemplo app.cliente.com o demo.premoos.site.",
                "Repositorio GitHub que se va a instalar.",
                "Proyecto Supabase creado para ese cliente o demo.",
                "Project URL, anon/publishable key y service_role key de Supabase.",
                "License API y Support API del panel admin, si ya esta publicado.",
            ]
        )
    )

    story.append(h1("1. Entrar al VPS por SSH"))
    story.extend(code("""
ssh -pPUERTO root@IP_DEL_VPS

# Ejemplo:
ssh -p5596 root@138.219.40.254
"""))
    story.extend(
        callout(
            "VNC no es necesario",
            "Para instalar aplicaciones Node, Nginx, PM2 y Certbot conviene usar SSH desde PowerShell. VNC solo sirve para ver una pantalla grafica del servidor.",
        )
    )

    story.append(h1("2. Clonar el proyecto por HTTPS"))
    story.append(p("Usar HTTPS evita configurar claves SSH en el VPS. Para el demo:"))
    story.extend(code("""
cd /root
git clone https://github.com/juliparissi/Demo-Premos.git demo-premos
cd demo-premos
npm install
"""))
    story.append(p("Para un cliente real, cambia el repo y el nombre de carpeta si corresponde:"))
    story.extend(code("""
cd /root
git clone https://github.com/juliparissi/PremOS.git cliente-premos
cd cliente-premos
npm install
"""))

    story.append(h1("3. Crear .env.local"))
    story.append(p("Dentro de la carpeta del proyecto, crear el archivo de variables:"))
    story.extend(code("""
nano .env.local
"""))
    story.append(p("Pegar este modelo y completar con los datos reales:"))
    story.extend(code("""
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_O_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY

OPENAI_API_KEY=

NEXT_PUBLIC_PREMOS_LICENSE_API_URL=https://admin.premoos.site/api/licencias
NEXT_PUBLIC_PREMOS_LICENSE_KEY=license_key_del_cliente
NEXT_PUBLIC_PREMOS_SUPPORT_API_URL=https://admin.premoos.site/api/soporte/tickets

NEXT_PUBLIC_PREMOS_DEMO_MODE=false
NEXT_PUBLIC_PREMOS_DEMO_EMAIL=
NEXT_PUBLIC_PREMOS_DEMO_PASSWORD=
"""))
    story.append(p("Guardar en nano: Ctrl + O, Enter, Ctrl + X."))
    story.extend(
        callout(
            "Variables obligatorias para compilar",
            "Si faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY, npm run build falla con el mensaje: Faltan variables publicas de Supabase.",
            WARN,
        )
    )

    story.append(h1("4. Crear tablas en Supabase"))
    story.append(
        bullets(
            [
                "Entrar al proyecto Supabase del cliente.",
                "Ir a SQL Editor.",
                "Ejecutar el archivo supabase/premos_schema_instalacion.sql.",
                "Si la base ya existia y solo falta Nomina, ejecutar supabase/premos_nomina.sql.",
                "Crear el usuario inicial en Authentication.",
            ]
        )
    )
    story.extend(
        callout(
            "Demo o cliente real",
            "No mezclar datos entre clientes. Lo mas simple y seguro para esta etapa comercial es un proyecto Supabase separado por cliente o por demo.",
        )
    )

    story.append(h1("5. Compilar"))
    story.extend(code("""
cd /root/demo-premos
npm run build
"""))
    story.append(p("Si el build termina sin errores, el proyecto esta listo para correr. Build no significa que quedo online; solo compilo."))

    story.append(h1("6. Limpiar PM2 si hay procesos viejos"))
    story.append(p("En VPS nuevos puede venir una app de ejemplo en PM2. Si queres usar el puerto 3000, conviene limpiar duplicados:"))
    story.extend(code("""
pm2 list
pm2 delete demo-premos
pm2 delete app
pm2 save
pm2 list
"""))
    story.extend(
        callout(
            "Cuidado",
            "Borrar app esta bien si es la app de ejemplo del VPS. Si el VPS ya tiene otro sistema real, no borrar procesos sin identificarlos.",
            WARN,
        )
    )

    story.append(h1("7. Levantar PremOS con PM2"))
    story.append(p("Para demo en puerto 3000:"))
    story.extend(code("""
cd /root/demo-premos
pm2 start npm --name demo-premos -- start -- -H 0.0.0.0 -p 3000
pm2 save
pm2 list
"""))
    story.append(p("Para cliente real, se puede usar otro nombre y puerto:"))
    story.extend(code("""
cd /root/cliente-premos
pm2 start npm --name cliente-premos -- start -- -H 0.0.0.0 -p 3000
pm2 save
pm2 list
"""))
    story.append(p("Probar desde el VPS:"))
    story.extend(code("""
curl http://127.0.0.1:3000
"""))

    story.append(h1("8. Configurar Nginx para el dominio"))
    story.append(p("Crear el archivo del sitio. Ejemplo para demo.premoos.site apuntando al puerto 3000:"))
    story.extend(code("""
nano /etc/nginx/sites-available/demo-premos
"""))
    story.extend(code("""
server {
    server_name demo.premoos.site;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
"""))
    story.append(p("Activar el sitio y recargar Nginx:"))
    story.extend(code("""
ln -s /etc/nginx/sites-available/demo-premos /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
"""))
    story.append(p("Probar en navegador: http://demo.premoos.site"))

    story.append(h1("9. Activar SSL con Certbot"))
    story.extend(code("""
certbot --nginx -d demo.premoos.site
"""))
    story.append(p("Despues probar: https://demo.premoos.site"))

    story.append(h1("10. Instalar el panel admin en el mismo VPS"))
    story.append(p("El panel admin se instala igual, pero con otro repo, otra carpeta, otro puerto y otro dominio. Ejemplo:"))
    story.extend(code("""
cd /root
git clone https://github.com/juliparissi/Panel-admin.git panel-admin
cd panel-admin
npm install
nano .env.local
"""))
    story.append(p("Modelo de .env.local para el panel admin:"))
    story.extend(code("""
NEXT_PUBLIC_SUPABASE_URL=https://TU_SUPABASE_ADMIN.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_O_PUBLISHABLE_KEY_ADMIN
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY_ADMIN
"""))
    story.append(p("Crear tablas del panel en Supabase admin:"))
    story.append(
        bullets(
            [
                "Ejecutar supabase/admin_schema.sql.",
                "Ejecutar supabase/add_license_key.sql si hiciera falta.",
                "Ejecutar supabase/admin_pagos.sql.",
                "Ejecutar supabase/support_tickets.sql.",
                "Ejecutar supabase/admin_supabase_access.sql.",
                "Crear usuario administrador en Authentication.",
            ]
        )
    )
    story.append(p("Compilar y levantar en puerto 3010:"))
    story.extend(code("""
npm run build
pm2 start npm --name panel-admin -- start -- -H 0.0.0.0 -p 3010
pm2 save
pm2 list
curl http://127.0.0.1:3010
"""))
    story.append(p("Nginx para admin.premoos.site:"))
    story.extend(code("""
nano /etc/nginx/sites-available/panel-admin
"""))
    story.extend(code("""
server {
    server_name admin.premoos.site;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
"""))
    story.extend(code("""
ln -s /etc/nginx/sites-available/panel-admin /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
certbot --nginx -d admin.premoos.site
"""))

    story.append(PageBreak())
    story.append(h1("11. Checklist final de entrega"))
    story.append(
        bullets(
            [
                "pm2 list muestra la app online.",
                "curl http://127.0.0.1:PUERTO devuelve HTML.",
                "nginx -t devuelve successful.",
                "El dominio abre con http.",
                "Certbot instala SSL y el dominio abre con https.",
                "El .env.local usa Supabase correcto.",
                "El cliente o demo tiene license_key cargada en panel admin.",
                "PremOS no muestra aviso de licencia si el panel admin esta online.",
                "Login de Supabase Auth funciona.",
                "Se prueba un flujo basico: cliente, producto, presupuesto, pedido y economia.",
            ]
        )
    )

    story.append(h1("12. Errores comunes y solucion rapida"))
    story.extend(
        data_table(
            ["Error", "Que significa", "Solucion"],
            [
                ["Permission denied (publickey)", "El VPS no tiene SSH configurado para GitHub.", "Clonar por HTTPS o configurar SSH key en GitHub."],
                ["Host key verification failed", "Primera conexion SSH a GitHub no fue aceptada.", "Responder yes cuando pregunta si confias en github.com."],
                ["Faltan variables publicas de Supabase", ".env.local no existe o faltan URL/Anon key.", "Crear .env.local y volver a correr npm run build."],
                ["EADDRINUSE puerto 3000", "Ya hay otro proceso usando ese puerto.", "pm2 list, borrar duplicados o usar otro puerto."],
                ["PM2 errored", "La app crasheo al arrancar.", "pm2 logs NOMBRE --lines 50."],
                ["El dominio no abre", "DNS, firewall o Nginx no apuntan bien.", "Revisar registros DNS, firewall cloud y nginx -t."],
                ["SSL falla", "El dominio todavia no apunta al VPS o Nginx no responde.", "Probar http primero y luego certbot."],
            ],
            [3.6, 5.4, 7.2],
        )
    )

    story.append(h1("13. Comandos utiles"))
    story.extend(code("""
pm2 list
pm2 logs demo-premos --lines 50
pm2 restart demo-premos
pm2 stop demo-premos
pm2 delete demo-premos
pm2 save

nginx -t
systemctl reload nginx

cd /root/demo-premos
git pull origin main
npm install
npm run build
pm2 restart demo-premos
"""))

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        rightMargin=0.7 * cm,
        leftMargin=0.7 * cm,
        topMargin=0.75 * cm,
        bottomMargin=0.75 * cm,
    )
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT)


if __name__ == "__main__":
    build()
