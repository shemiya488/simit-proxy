const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const TOKEN_URL = "https://civiiv2.civii.co/back-civii/api/v1/auth/widget-token";
const SIMIT_URL = "https://consultasimit.fcm.org.co/simit/microservices/estado-cuenta-simit/estadocuenta/consulta";

const HEADERS_TOKEN = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "es",
    "Content-Type": "application/json",
    "Origin": "https://www.fcm.org.co",
    "Referer": "https://www.fcm.org.co/",
    "Sec-Ch-Ua": '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?1",
    "Sec-Ch-Ua-Platform": '"Android"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36"
};

async function getToken() {
    const res = await axios.post(TOKEN_URL, { operation: "simit" }, {
        headers: HEADERS_TOKEN,
        timeout: 10000
    });
    return res.data?.token;
}

app.post("/api/simit", async (req, res) => {
    const filtro = req.body.filtro || req.body.documento || req.body.placa;
    if (!filtro) {
        return res.status(400).json({ ok: false, error: "El campo 'filtro' es obligatorio" });
    }

    try {
        const token = await getToken();
        if (!token) {
            return res.status(500).json({ ok: false, error: "No se pudo obtener token" });
        }

        const response = await axios.post(
            SIMIT_URL,
            { filtro },
            {
                headers: {
                    ...HEADERS_TOKEN,
                    "Sec-Fetch-Site": "same-site",
                    "Authorization": `Bearer ${token}`
                },
                timeout: 20000
            }
        );

        const data = response.data?.data ?? response.data;
        const status = (!data || (Array.isArray(data) && data.length === 0)) ? "notfound" : "ok";
        return res.json({ ok: true, status, data });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: "Error consultando SIMIT",
            codigo: error.response?.status,
            detalle: error.message,
            respuesta: error.response?.data
        });
    }
});

app.get("/", (req, res) => res.json({ status: "ok", message: "Proxy SIMIT v6 activo" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy SIMIT v6 corriendo en puerto ${PORT}`));
