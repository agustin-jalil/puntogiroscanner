// src/app-ai/objectDetection.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { HfInference } from '@huggingface/inference';
import reciclajeMap from '../pages/data/reciclajeMap.js';

const ObjectDetection = ({ hfToken }) => {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hf = new HfInference(hfToken);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);
        setCameraAvailable(true);
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      setCameraAvailable(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const scanImage = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

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

  const reset = () => {
    setImage(null);
    setPredictions([]);
    stopCamera();
  };

  useEffect(() => {
    startCamera();
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

      {/* Vista de la cámara o fallback */}
      <div style={{ width: 200, height: 400, marginBottom: 10 }}>
        {cameraAvailable && streamActive ? (
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
            autoPlay
            playsInline
            muted
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              color: '#888'
            }}
          >
            Cámara no disponible
          </div>
        )}
      </div>

      <button onClick={scanImage} style={{ marginRight: 10 }}>📷 Escanear</button>
      <button onClick={reset}>🔄 Restablecer</button>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {image && (
        <img src={image} alt="Imagen capturada" style={{ maxWidth: '100%', height: 'auto', marginBottom: 20 }} />
      )}

      {predictions.length > 0 && (
        <div>
          <h3>♻️ Resultados de reciclaje:</h3>
          {predictions.map((pred, idx) => {
            const categoria = reciclajeMap[pred.label] || 'desconocido';
            return (
              <div key={idx}>
                <strong>{pred.label}</strong> – {Math.round(pred.score * 100)}%
                <br />
                Categoría: <strong>{categoria}</strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ObjectDetection;
