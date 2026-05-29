const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SIMIT_URL = "https://consultasimit.fcm.org.co/simit/microservices/estado-cuenta-simit/estadocuenta/consulta";

app.post("/api/simit", async (req, res) => {
    const filtro = req.body.filtro || req.body.documento || req.body.placa;

    if (!filtro) {
        return res.status(400).json({ ok: false, error: "El campo 'filtro' es obligatorio" });
    }

    try {
        const response = await axios.post(
            SIMIT_URL,
            { filtro },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
                    "Origin": "https://www.fcm.org.co",
                    "Referer": "https://www.fcm.org.co/simit/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "sec-ch-ua": '"Chromium";v="120", "Google Chrome";v="120"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Windows"',
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin"
                },
                timeout: 20000
            }
        );

        const data = response.data?.data ?? response.data;
        const status = (!data || (Array.isArray(data) && data.length === 0)) ? "notfound" : "ok";

        return res.json({ ok: true, status, data });

    } catch (error) {
        const status = error.response?.status;
        const body = error.response?.data;
        return res.status(500).json({
            ok: false,
            error: "No fue posible consultar SIMIT",
            codigo: status,
            detalle: error.message,
            respuesta: body
        });
    }
});

app.get("/", (req, res) => res.json({ status: "ok", message: "Proxy SIMIT activo" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy SIMIT corriendo en puerto ${PORT}`));
