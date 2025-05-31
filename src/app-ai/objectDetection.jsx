// src/app-ai/objectDetection.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { HfInference } from '@huggingface/inference';
import reciclajeMap from '../pages/data/reciclajeMap.js';

const ObjectDetection = ({ hfToken }) => {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hf = new HfInference(hfToken);

  // Iniciar cámara trasera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Cámara trasera
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // Capturar imagen del video y hacer la detección
  const scanImage = async () => {
    if (!videoRef.current) return;

    // Dibujar el frame actual en canvas
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir canvas a blob para enviar al modelo
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setImage(URL.createObjectURL(blob));
      try {
        const result = await hf.objectDetection({
          model: 'facebook/detr-resnet-50',
          data: blob
        });
        console.log('Resultado:', result);
        setPredictions(result);
      } catch (error) {
        console.error('Error en la detección de objetos:', error);
      }
    }, 'image/jpeg');
  };

  // Restablecer estado
  const reset = () => {
    setImage(null);
    setPredictions([]);
    stopCamera();
  };

  // Limpieza cuando el componente se desmonta
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      stopCamera();
      const file = acceptedFiles[0];
      setImage(URL.createObjectURL(file));
      try {
        const result = await hf.objectDetection({
          model: 'facebook/detr-resnet-50',
          data: file
        });
        console.log('Resultado:', result);
        setPredictions(result);
      } catch (error) {
        console.error('Error en la detección de objetos:', error);
      }
    }
  });

  return (
    <div>
      <div {...getRootProps()} style={{ border: '2px dashed #ccc', padding: 20, marginBottom: 20 }}>
        <input {...getInputProps()} />
        <p>Arrastra y suelta una imagen aquí, o haz clic para seleccionar una</p>
      </div>

      {!streamActive && (
        <button onClick={startCamera} style={{ marginBottom: 10 }}>Abrir cámara trasera</button>
      )}

      {streamActive && (
        <>
          <video
            ref={videoRef}
            style={{ width: '100%', maxHeight: 400, marginBottom: 10 }}
            autoPlay
            playsInline
          />
          <button onClick={scanImage} style={{ marginRight: 10 }}>Scanear</button>
          <button onClick={reset}>Restablecer</button>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {image && (
        <img src={image} alt="Imagen capturada" style={{ maxWidth: '100%', height: 'auto', marginBottom: 20 }} />
      )}

      {predictions.length > 0 && (
        <div>
          <h3>Resultados:</h3>
          {predictions.map((pred, idx) => {
            const categoria = reciclajeMap[pred.label] || 'desconocido';
            return (
              <div key={idx}>
                <strong>{pred.label}</strong> – {Math.round(pred.score * 100)}%
                <br />
                ♻️ Categoría: <strong>{categoria}</strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ObjectDetection;
