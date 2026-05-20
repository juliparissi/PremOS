import tkinter as tk
from tkinter import messagebox
import subprocess
import webbrowser

# Ruta del proyecto PremOS
RUTA_PROYECTO = r"C:\Users\julip\OneDrive\Escritorio\premos"

# URL local
URL = "http://localhost:3000"

# Variable global proceso
server_process = None


def iniciar_server():

    global server_process

    if server_process is None:

        try:

            server_process = subprocess.Popen(
    ["cmd", "/c", "npm run dev"],
    cwd=RUTA_PROYECTO,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
    creationflags=subprocess.CREATE_NO_WINDOW
)

            estado_label.config(
                text="Servidor iniciado 😎",
                fg="#00ff99"
            )

        except Exception as e:

            messagebox.showerror(
                "Error",
                str(e)
            )


def apagar_server():

    global server_process

    try:

        subprocess.call(
            'taskkill /F /IM node.exe',
            shell=True
        )

        server_process = None

        estado_label.config(
            text="Servidor apagado 😴",
            fg="#ff5555"
        )

    except Exception as e:

        messagebox.showerror(
            "Error",
            str(e)
        )


def reiniciar_server():

    apagar_server()

    ventana.after(
        2000,
        iniciar_server
    )


def abrir_premos():

    webbrowser.open(URL)


# Ventana principal
ventana = tk.Tk()

ventana.title("PremOS Launcher")

ventana.geometry("420x550")

ventana.configure(bg="#07111f")

ventana.resizable(False, False)


# Logo
logo = tk.Label(
    ventana,
    text="PremOS",
    font=("Segoe UI", 32, "bold"),
    fg="#00ff99",
    bg="#07111f"
)

logo.pack(pady=(35, 5))


# Subtítulo
subtitulo = tk.Label(
    ventana,
    text="Launcher del servidor",
    font=("Segoe UI", 11),
    fg="#8b949e",
    bg="#07111f"
)

subtitulo.pack(pady=(0, 25))


# Botón iniciar
btn_iniciar = tk.Button(
    ventana,
    text="Iniciar server",
    command=iniciar_server,
    bg="#00c781",
    fg="black",
    activebackground="#00ff99",
    font=("Segoe UI", 12, "bold"),
    relief="flat",
    padx=25,
    pady=12,
    cursor="hand2",
    width=22
)

btn_iniciar.pack(pady=8)


# Botón reiniciar
btn_reiniciar = tk.Button(
    ventana,
    text="Reiniciar server",
    command=reiniciar_server,
    bg="#1e293b",
    fg="white",
    activebackground="#334155",
    font=("Segoe UI", 12, "bold"),
    relief="flat",
    padx=25,
    pady=12,
    cursor="hand2",
    width=22
)

btn_reiniciar.pack(pady=8)


# Botón apagar
btn_apagar = tk.Button(
    ventana,
    text="Apagar server",
    command=apagar_server,
    bg="#7f1d1d",
    fg="white",
    activebackground="#991b1b",
    font=("Segoe UI", 12, "bold"),
    relief="flat",
    padx=25,
    pady=12,
    cursor="hand2",
    width=22
)

btn_apagar.pack(pady=8)


# Link localhost
link = tk.Label(
    ventana,
    text=URL,
    font=("Segoe UI", 11, "underline"),
    fg="#00ff99",
    bg="#07111f",
    cursor="hand2"
)

link.pack(pady=(25, 8))

link.bind(
    "<Button-1>",
    lambda e: abrir_premos()
)


# Estado servidor
estado_label = tk.Label(
    ventana,
    text="Servidor apagado 😴",
    font=("Segoe UI", 10),
    fg="#ff5555",
    bg="#07111f"
)

estado_label.pack(pady=5)


# Botón cerrar
btn_cerrar = tk.Button(
    ventana,
    text="Cerrar launcher",
    command=ventana.destroy,
    bg="#111827",
    fg="white",
    activebackground="#1f2937",
    font=("Segoe UI", 10),
    relief="flat",
    padx=15,
    pady=10,
    cursor="hand2",
    width=18
)

btn_cerrar.pack(pady=(20, 0))


# Ejecutar app
ventana.mainloop()