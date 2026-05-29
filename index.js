const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SIMIT_URL = "https://consultasimit.fcm.org.co/simit/microservices/estado-cuenta-simit/estadocuenta/consulta";

// Ruta principal de consulta
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
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
                },
                timeout: 15000
            }
        );

        const data = response.data?.data ?? response.data;
        const status = (!data || (Array.isArray(data) && data.length === 0)) ? "notfound" : "ok";

        return res.json({ ok: true, status, data });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: "No fue posible consultar SIMIT",
            detalle: error.message
        });
    }
});

// Health check para Render
app.get("/", (req, res) => res.json({ status: "ok", message: "Proxy SIMIT activo" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy SIMIT corriendo en puerto ${PORT}`));
