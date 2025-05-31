import React, { useRef, useEffect, useState } from "react";

// NOTA: El modelo DETR de Hugging Face no puede ejecutarse directamente en el navegador.
// Se requiere un backend o usar Hugging Face Inference API.
// Este ejemplo usa la API de Hugging Face para enviar frames y obtener resultados.

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/facebook/detr-resnet-50";
const HUGGINGFACE_API_TOKEN = "TU_TOKEN_AQUI"; // Reemplaza con tu token de Hugging Face

function ObjectDetection() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modal2Open, setModal2Open] = useState(false);
    const [loading, setLoading] = useState(false);
    const [detections, setDetections] = useState([]);

    useEffect(() => {
        // Solicitar acceso a la cámara
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                alert("No se pudo acceder a la cámara: " + err.message);
            });
        return () => {
            // Detener la cámara al desmontar
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Captura un frame y lo envía a Hugging Face
    const handleDetect = async () => {
        setLoading(true);
        setDetections([]);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        // Dibujar el frame actual en el canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convertir el canvas a blob
        canvas.toBlob(async (blob) => {
            // Enviar a Hugging Face
            const response = await fetch(HUGGINGFACE_API_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
                },
                body: blob,
            });
            const result = await response.json();
            setDetections(result);
            setLoading(false);
            drawDetections(result);
        }, "image/jpeg");
    };

    // Dibuja los resultados en el canvas
    const drawDetections = (results) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        ctx.font = "16px Arial";
        if (Array.isArray(results)) {
            results.forEach(obj => {
                const [x, y, w, h] = obj.box;
                ctx.strokeStyle = "#00FF00";
                ctx.strokeRect(x, y, w, h);
                ctx.fillStyle = "#00FF00";
                ctx.fillText(obj.label + " " + (obj.score * 100).toFixed(1) + "%", x, y > 20 ? y - 5 : y + 15);
            });
        }
    };

    return (
        <div style={{ textAlign: "center" }}>
            <h2>Detección de Objetos (DETR ResNet-50)</h2>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", maxWidth: 400, borderRadius: 8 }}
            />
            <canvas
                ref={canvasRef}
                style={{ display: "block", margin: "10px auto", maxWidth: 400 }}
            />
            <div>
                <button onClick={handleDetect} disabled={loading}>
                    {loading ? "Detectando..." : "Detectar Objetos"}
                </button>
                <button onClick={() => setModalOpen(true)} style={{ marginLeft: 10 }}>
                    Abrir Modal 1
                </button>
                <button onClick={() => setModal2Open(true)} style={{ marginLeft: 10 }}>
                    Abrir Modal 2
                </button>
            </div>
            {/* Modal 1 */}
            {modalOpen && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <h3>Modal 1</h3>
                        <button onClick={() => setModalOpen(false)}>Cerrar</button>
                    </div>
                </div>
            )}
            {/* Modal 2 */}
            {modal2Open && (
                <div style={modalStyle}>
                    <div style={modalContentStyle}>
                        <h3>Modal 2</h3>
                        <button onClick={() => setModal2Open(false)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Estilos simples para el modal
const modalStyle = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
};
const modalContentStyle = {
    background: "#fff",
    padding: 24,
    borderRadius: 8,
    minWidth: 200,
    textAlign: "center",
};

export default ObjectDetection;