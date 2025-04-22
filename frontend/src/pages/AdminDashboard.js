import React, { useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [modelName, setModelName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [variables, setVariables] = useState(['']);

  const handleVariableChange = (index, value) => {
    const newVariables = [...variables];
    newVariables[index] = value;
    setVariables(newVariables);
  };

  const addVariableField = () => {
    setVariables([...variables, '']);
  };

  const createModel = async () => {
    try {
      const response = await axios.post('http://localhost:8000/models/', {
        nom: modelName,
        type_entreprise: companyType,
        variables,
      });
      console.log('Modèle créé:', response.data);
    } catch (error) {
      console.error('Erreur lors de la création du modèle:', error);
    }
  };

  return (
    <div>
      <h1>Créer un Modèle</h1>
      <input
        type="text"
        placeholder="Nom du modèle"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Type d'entreprise"
        value={companyType}
        onChange={(e) => setCompanyType(e.target.value)}
      />
      {variables.map((variable, index) => (
        <input
          key={index}
          type="text"
          placeholder="Variable"
          value={variable}
          onChange={(e) => handleVariableChange(index, e.target.value)}
        />
      ))}
      <button onClick={addVariableField}>Ajouter une variable</button>
      <button onClick={createModel}>Créer le modèle</button>
    </div>
  );
};

export default AdminDashboard;
