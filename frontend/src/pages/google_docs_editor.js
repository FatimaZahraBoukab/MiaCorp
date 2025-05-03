import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GoogleDocsEditor = ({ template, onSave, onClose }) => {
  const [content, setContent] = useState('');
  const [variables, setVariables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocumentContent = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:8000/templates/${template.id}/content`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setContent(response.data.content);
        setVariables(response.data.variables);
      } catch (err) {
        setError('Failed to load document content');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentContent();
  }, [template.id]);

  const handleVariableChange = (id, value) => {
    setVariables(vars =>
      vars.map(v => (v.id === id ? { ...v, value } : v))
    );
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8000/templates/${template.id}`,
        {
          variables,
          content
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onSave();
    } catch (err) {
      setError('Failed to save changes');
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="editor-modal">
      <div className="editor-header">
        <h2>Editing: {template.titre}</h2>
        <button onClick={onClose}>Close</button>
      </div>
      
      <div className="editor-content">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      
      <div className="variables-section">
        <h3>Variables</h3>
        {variables.map((variable) => (
          <div key={variable.id} className="variable-input">
            <label>{variable.nom}</label>
            <input
              type="text"
              value={variable.value || ''}
              onChange={(e) => handleVariableChange(variable.id, e.target.value)}
            />
          </div>
        ))}
      </div>
      
      <div className="editor-actions">
        <button onClick={handleSave}>Save Changes</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default GoogleDocsEditor;