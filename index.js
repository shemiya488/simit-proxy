const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SIMIT_BASE = "https://consultasimit.fcm.org.co";
const SIMIT_URL  = `${SIMIT_BASE}/simit/microservices/estado-cuenta-simit/estadocuenta/consulta`;
const TOKEN_URL  = `${SIMIT_BASE}/simit/microservices/estado-cuenta-simit/estadocuenta/token`;

// Obtener token fresco del SIMIT
async function getToken() {
    try {
        const res = await axios.get(TOKEN_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, text/plain, */*",
                "Origin": "https://fcm.org.co",
                "Referer": "https://fcm.org.co/simit/"
            },
            timeout: 10000
        });
        return res.data?.token || res.data?.access_token || res.data;
    } catch(e) {
        return null;
    }
}

app.post("/api/simit", async (req, res) => {
    const filtro = req.body.filtro || req.body.documento || req.body.placa;

    if (!filtro) {
        return res.status(400).json({ ok: false, error: "El campo 'filtro' es obligatorio" });
    }

    // Intentar primero sin token, luego con token
    const intentos = [
        // Intento 1: sin token, simulando navegador
        {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "es-CO,es;q=0.9",
                "Origin": "https://fcm.org.co",
                "Referer": "https://fcm.org.co/simit/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-site"
            }
        },
        // Intento 2: con origen móvil
        {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": "https://fcm.org.co",
                "Referer": "https://fcm.org.co/simit/",
                "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36",
                "X-Requested-With": "XMLHttpRequest"
            }
        }
    ];

    for (const intento of intentos) {
        try {
            const response = await axios.post(
                SIMIT_URL,
                { filtro },
                { headers: intento.headers, timeout: 20000 }
            );

            const data = response.data?.data ?? response.data;
            const status = (!data || (Array.isArray(data) && data.length === 0)) ? "notfound" : "ok";
            return res.json({ ok: true, status, data });

        } catch (error) {
            const code = error.response?.status;
            // Si no es 401/403, salir del loop
            if (code !== 401 && code !== 403) {
                return res.status(500).json({
                    ok: false,
                    error: "Error consultando SIMIT",
                    codigo: code,
                    detalle: error.message
                });
            }
            // Si es 401/403, intentar el siguiente
        }
    }

    // Último recurso: intentar obtener token dinámico
    const token = await getToken();
    if (token) {
        try {
            const response = await axios.post(
                SIMIT_URL,
                { filtro },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`,
                        "Origin": "https://fcm.org.co",
                        "Referer": "https://fcm.org.co/simit/",
                        "User-Agent": "Mozilla/5.0 Chrome/120"
                    },
                    timeout: 20000
                }
            );
            const data = response.data?.data ?? response.data;
            const status = (!data || (Array.isArray(data) && data.length === 0)) ? "notfound" : "ok";
            return res.json({ ok: true, status, data });
        } catch(e) {
            // token tampoco funcionó
        }
    }

    return res.status(500).json({
        ok: false,
        error: "El SIMIT requiere autenticación especial. Intenta más tarde."
    });
});

app.get("/", (req, res) => res.json({ status: "ok", message: "Proxy SIMIT v3 activo" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy SIMIT v3 corriendo en puerto ${PORT}`));
