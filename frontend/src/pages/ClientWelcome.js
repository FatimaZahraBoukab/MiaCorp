import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Typography, Container, Paper, 
  Tabs, Tab, Table, TableBody, 
  TableCell, TableContainer, TableHead, 
  TableRow, Button, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

const ClientWelcome = () => {
  const [user, setUser] = useState(null);
  const [entreprises, setEntreprises] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openEntrepriseDialog, setOpenEntrepriseDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [newEntreprise, setNewEntreprise] = useState({
    nom: '',
    type: 'SAS',
    siret: '',
    adresse: '',
    capital: 0,
    description: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [documentVariables, setDocumentVariables] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    fetchEntreprises();
    fetchDocuments();
    fetchTemplates();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchEntreprises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/entreprises/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntreprises(response.data);
    } catch (error) {
      console.error('Error fetching entreprises:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/documents/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/templates/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateEntreprise = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/entreprises/', newEntreprise, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEntreprises();
      setOpenEntrepriseDialog(false);
      setNewEntreprise({
        nom: '',
        type: 'SAS',
        siret: '',
        adresse: '',
        capital: 0,
        description: ''
      });
    } catch (error) {
      console.error('Error creating entreprise:', error);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    // Initialize variables with default values
    const vars = {};
    template.variables.forEach(variable => {
      vars[variable.nom] = variable.valeur_defaut || '';
    });
    setDocumentVariables(vars);
    setOpenDocumentDialog(true);
  };

  const handleCreateDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      // In a real app, you would select the entreprise to associate with the document
      const entrepriseId = entreprises.length > 0 ? entreprises[0].id : null;
      
      if (!entrepriseId) {
        alert('Vous devez d\'abord créer une entreprise');
        return;
      }

      await axios.post('http://localhost:8000/documents/', {
        template_id: selectedTemplate.id,
        entreprise_id: entrepriseId,
        valeurs_variables: documentVariables
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchDocuments();
      setOpenDocumentDialog(false);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleSubmitDocument = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/documents/${documentId}/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error submitting document:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Bienvenue, {user.prenom} {user.nom}
        </Typography>
        <Button variant="contained" color="error" onClick={handleLogout}>Déconnexion</Button>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Mes Entreprises" />
          <Tab label="Mes Documents" />
          <Tab label="Créer un Nouveau Document" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={() => setOpenEntrepriseDialog(true)}>
              Créer une Nouvelle Entreprise
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>SIRET</TableCell>
                  <TableCell>Capital</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entreprises.map((entreprise) => (
                  <TableRow key={entreprise.id}>
                    <TableCell>{entreprise.nom}</TableCell>
                    <TableCell>{entreprise.type}</TableCell>
                    <TableCell>{entreprise.siret}</TableCell>
                    <TableCell>{entreprise.capital} €</TableCell>
                    <TableCell>{entreprise.statut}</TableCell>
                    <TableCell>
                      <Button size="small">Modifier</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type de Document</TableCell>
                  <TableCell>Entreprise</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>{document.template_id}</TableCell>
                    <TableCell>{document.entreprise_id}</TableCell>
                    <TableCell>{document.statut}</TableCell>
                    <TableCell>{new Date(document.date_creation).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {document.statut === 'brouillon' && (
                        <Button 
                          variant="contained" 
                          size="small"
                          onClick={() => handleSubmitDocument(document.id)}
                        >
                          Soumettre
                        </Button>
                      )}
                      {document.statut === 'validé' && (
                        <Button 
                          variant="contained" 
                          size="small"
                          onClick={() => window.open(
                            `http://localhost:8000/documents/${document.id}/download`,
                            '_blank'
                          )}
                        >
                          Télécharger
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>Choisissez un Modèle de Document</Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {templates.map((template) => (
              <Paper key={template.id} sx={{ p: 3, width: 300 }}>
                <Typography variant="h6">{template.titre}</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>{template.description}</Typography>
                <Typography variant="caption">Type: {template.type_entreprise}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="contained"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    Sélectionner
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* Create Entreprise Dialog */}
      <Dialog open={openEntrepriseDialog} onClose={() => setOpenEntrepriseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Créer une Nouvelle Entreprise</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Nom de l'entreprise"
              fullWidth
              value={newEntreprise.nom}
              onChange={(e) => setNewEntreprise({...newEntreprise, nom: e.target.value})}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type d'Entreprise</InputLabel>
              <Select
                value={newEntreprise.type}
                onChange={(e) => setNewEntreprise({...newEntreprise, type: e.target.value})}
              >
                <MenuItem value="SAS">SAS</MenuItem>
                <MenuItem value="SARL">SARL</MenuItem>
                <MenuItem value="SASU">SASU</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="SIRET"
              fullWidth
              value={newEntreprise.siret}
              onChange={(e) => setNewEntreprise({...newEntreprise, siret: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Adresse"
              fullWidth
              value={newEntreprise.adresse}
              onChange={(e) => setNewEntreprise({...newEntreprise, adresse: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Capital (€)"
              type="number"
              fullWidth
              value={newEntreprise.capital}
              onChange={(e) => setNewEntreprise({...newEntreprise, capital: parseFloat(e.target.value)})}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newEntreprise.description}
              onChange={(e) => setNewEntreprise({...newEntreprise, description: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEntrepriseDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateEntreprise}>Créer</Button>
        </DialogActions>
      </Dialog>

      {/* Create Document Dialog */}
      <Dialog 
        open={openDocumentDialog} 
        onClose={() => setOpenDocumentDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Créer un Nouveau Document: {selectedTemplate?.titre}</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Remplissez les informations requises</Typography>
              
              {selectedTemplate.variables.map((variable) => (
                <TextField
                  key={variable.nom}
                  label={variable.nom}
                  fullWidth
                  required={variable.obligatoire}
                  value={documentVariables[variable.nom] || ''}
                  onChange={(e) => setDocumentVariables({
                    ...documentVariables,
                    [variable.nom]: e.target.value
                  })}
                  sx={{ mb: 2 }}
                />
              ))}
              
              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Aperçu du Document</Typography>
              <Box sx={{ height: '400px', border: '1px solid #ccc' }}>
                <iframe 
                  src={`http://localhost:8000/documents/preview?template_id=${selectedTemplate.id}&variables=${encodeURIComponent(JSON.stringify(documentVariables))}`}
                  width="100%" 
                  height="100%" 
                  style={{ border: 'none' }}
                  title="Document Preview"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDocumentDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateDocument}>Enregistrer Brouillon</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClientWelcome;