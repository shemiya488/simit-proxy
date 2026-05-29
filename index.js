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
        const ts = Date.now();
        const cookie = [
            `_gid=GA1.3.${Math.floor(Math.random()*9999999999)}.${ts}`,
            `_fbp=fb.2.${ts}.${Math.floor(Math.random()*9999999999999)}`,
            `_gcl_au=1.1.${Math.floor(Math.random()*9999999999)}.${ts}`,
            `_ga=GA1.3.${Math.floor(Math.random()*9999999999)}.${ts}`,
            `_gat_UA-113777949-32=1`,
            `_ga_8TBQXXE1D2=GS2.1.${ts}$o1$g1$t${ts}$j60$l0$h0`
        ].join("; ");

        const response = await axios.post(
            SIMIT_URL,
            { filtro },
            {
                headers: {
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip, deflate, br, zstd",
                    "Accept-Language": "es",
                    "Connection": "keep-alive",
                    "Content-Type": "application/json",
                    "Cookie": cookie,
                    "Host": "consultasimit.fcm.org.co",
                    "Origin": "https://www.fcm.org.co",
                    "Referer": "https://www.fcm.org.co/",
                    "Sec-Ch-Ua": '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
                    "Sec-Ch-Ua-Mobile": "?1",
                    "Sec-Ch-Ua-Platform": '"Android"',
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-site",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36"
                },
                timeout: 20000,
                decompress: true
            }
        );

        const data = response.data?.data ?? response.data;
        const status = (!data || (Array.isArray(data) && data.length === 0)) ? "notfound" : "ok";
        return res.json({ ok: true, status, data });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: "No fue posible consultar SIMIT",
            codigo: error.response?.status,
            detalle: error.message,
            respuesta: error.response?.data
        });
    }
});

app.get("/", (req, res) => res.json({ status: "ok", message: "Proxy SIMIT v4 activo" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy SIMIT v4 corriendo en puerto ${PORT}`));
