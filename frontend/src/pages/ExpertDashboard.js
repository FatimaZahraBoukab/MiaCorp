import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Typography, Container, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';

const ExpertDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [comment, setComment] = useState('');
  const [openReviewDialog, setOpenReviewDialog] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

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

  const handleReviewDocument = (document) => {
    setSelectedDocument(document);
    setOpenReviewDialog(true);
  };

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/documents/${selectedDocument.id}`, {
        statut: 'validé',
        commentaires: comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
      setOpenReviewDialog(false);
    } catch (error) {
      console.error('Error approving document:', error);
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/documents/${selectedDocument.id}`, {
        statut: 'rejeté',
        commentaires: comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
      setOpenReviewDialog(false);
    } catch (error) {
      console.error('Error rejecting document:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">Expert Dashboard</Typography>
        <Button variant="contained" color="error" onClick={handleLogout}>Logout</Button>
      </Box>

      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Documents à Valider</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Entreprise</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.filter(doc => doc.statut === 'en_review').map((document) => (
                <TableRow key={document.id}>
                  <TableCell>{document.client_id}</TableCell>
                  <TableCell>{document.entreprise_id}</TableCell>
                  <TableCell>{document.template_id}</TableCell>
                  <TableCell>{document.statut}</TableCell>
                  <TableCell>{new Date(document.date_creation).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => handleReviewDocument(document)}
                    >
                      Examiner
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Historique des Validations</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Entreprise</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date Validation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.filter(doc => doc.statut !== 'en_review').map((document) => (
                <TableRow key={document.id}>
                  <TableCell>{document.client_id}</TableCell>
                  <TableCell>{document.entreprise_id}</TableCell>
                  <TableCell>{document.template_id}</TableCell>
                  <TableCell>{document.statut}</TableCell>
                  <TableCell>
                    {document.date_validation ? new Date(document.date_validation).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Review Dialog */}
      <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Examiner le Document</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Informations du Document</Typography>
              <Typography>Client: {selectedDocument.client_id}</Typography>
              <Typography>Entreprise: {selectedDocument.entreprise_id}</Typography>
              <Typography>Type: {selectedDocument.template_id}</Typography>
              
              <Box sx={{ mt: 3, height: '500px', border: '1px solid #ccc' }}>
                <iframe 
                  src={`http://localhost:8000/documents/${selectedDocument.id}/preview`}
                  width="100%" 
                  height="100%" 
                  style={{ border: 'none' }}
                  title="Document Preview"
                />
              </Box>
              
              <TextField
                label="Commentaires"
                fullWidth
                multiline
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{ mt: 3 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleReject}>Rejeter</Button>
          <Button variant="contained" color="success" onClick={handleApprove}>Valider</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExpertDashboard;