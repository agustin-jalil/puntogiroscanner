// src/app-ai/objectDetection.jsx
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { HfInference } from '@huggingface/inference';
import reciclajeMap from '../pages/data/reciclajeMap.js';

const ObjectDetection = ({ hfToken }) => {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const hf = new HfInference(hfToken);

  const onDrop = async (acceptedFiles) => {
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
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()} style={{ border: '2px dashed #ccc', padding: '20px', marginBottom: '20px' }}>
        <input {...getInputProps()} />
        <p>Arrastra y suelta una imagen aquí, o haz clic para seleccionar una</p>
      </div>

      {image && (
        <img src={image} alt="Imagen cargada" style={{ maxWidth: '100%', height: 'auto', marginBottom: '20px' }} />
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
