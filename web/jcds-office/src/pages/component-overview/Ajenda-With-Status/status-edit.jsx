import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AgendaService from '../../../service/ajenda.service';
import StatusWithAgendaService from '../../../service/status.service';
import { useTranslation } from 'react-i18next';

const EditAgendaStatus = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const statusId = location.state?.id;

  const [formValues, setFormValues] = useState({
    agenda_id: '',
    name: '',
    description: '',
    decision_type: '',
    type: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const validateField = (name, value) => {
    let message = '';
    if (name === 'agenda_id' && !value) message = t('ajenda.agenda_required');
    if (name === 'name' && !value) message = t('ajenda.status_name_required');
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      type: checked ? value.toLowerCase() : ''
    }));
  };

  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleUpdateAgendaStatus();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      navigate('/ajenda-status');
    }
  };

  const handleBackClick = () => {
    navigate('/ajenda-status');
  };

  const fetchAgendas = async () => {
    setLoading(true);
    try {
      const fetchedAgendas = await AgendaService.getAllAgendas();
      setAgendas(fetchedAgendas);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusData = async () => {
    if (!statusId) return;
    setLoading(true);
    try {
      const statusData = await StatusWithAgendaService.getStatusWithAgendaById(statusId);
      setFormValues({
        agenda_id: statusData.agenda_id || '',
        name: statusData.name || '',
        decision_type: statusData.decision_type || '',
        description: statusData.description || '',
        type: statusData.type || ''
      });
    } catch (error) {
      console.error('Error fetching status data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendas();
    fetchStatusData();
  }, []);

  const handleUpdateAgendaStatus = async () => {
    try {
      const { name, description, agenda_id, decision_type, type } = formValues;
      const updatedAgendaStatus = {
        name,
        description,
        agenda_id,
        decision_type,
        ...(type && { type })
      };

      await StatusWithAgendaService.updateStatusWithAgenda(statusId, updatedAgendaStatus);
      setSnackbar({
        open: true,
        message: t('ajenda.status_updated_success'),
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/ajenda-status');
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('ajenda.status_update_failed'),
        severity: 'error'
      });
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '99%',
        ml: 1,
        p: 4,
        border: '1px solid',
        borderColor: 'grey.400',
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('ajenda.edit_status')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>{t('ajenda.agenda')}</InputLabel>
          <Select
            label={t('ajenda.agenda')}
            name="agenda_id"
            value={formValues.agenda_id}
            onChange={handleInputChange}
            onFocus={() => handleFocus('agenda_id')}
            onBlur={() => validateField('agenda_id', formValues.agenda_id)}
            error={!!formErrors.agenda_id && touched.agenda_id}
          >
            <MenuItem value="">
              <em>{t('ajenda.none_selected')}</em>
            </MenuItem>
            {agendas.map((agenda) => (
              <MenuItem key={agenda.agenda_id} value={agenda.agenda_id}>
                {agenda.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {formErrors.agenda_id && touched.agenda_id && (
          <Typography sx={{ color: 'red', fontSize: '12px' }}>
            <CloseCircleOutlined style={{ marginRight: '4px' }} />
            {formErrors.agenda_id}
          </Typography>
        )}

        <TextField
          label={t('ajenda.status_name')}
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onFocus={() => handleFocus('name')}
          onBlur={() => validateField('name', formValues.name)}
          error={!!formErrors.name && touched.name}
          helperText={
            formErrors.name && touched.name ? (
              <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                <CloseCircleOutlined style={{ marginRight: '4px' }} />
                {formErrors.name}
              </span>
            ) : touched.name && formValues.name && !formErrors.name ? (
              <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutlined style={{ marginRight: '4px' }} />
                {t('ajenda.looks_good')}
              </span>
            ) : null
          }
          sx={{ flex: 1 }}
        />

        <Box sx={{ mt: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t('ajenda.decision_type')}</InputLabel>
            <Select label={t('ajenda.decision_type')} name="decision_type" value={formValues.decision_type} onChange={handleInputChange}>
              <MenuItem value="">
                <em>{t('ajenda.none')}</em>
              </MenuItem>
              <MenuItem value="forward to judge">{t('ajenda.forward_to_judge')}</MenuItem>
              <MenuItem value="forward to council office">{t('ajenda.forward_to_council_office')}</MenuItem>
              <MenuItem value="complaint closed">{t('ajenda.complaint_closed')}</MenuItem>
              <MenuItem value="back to committee">{t('ajenda.back_to_committee')}</MenuItem>
              <MenuItem value="back to council">{t('ajenda.back_to_council')}</MenuItem>
              <MenuItem value="forward to committee">{t('ajenda.forward_to_committee')}</MenuItem>
              <MenuItem value="forward to council">{t('ajenda.forward_to_council')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField
          label={t('ajenda.description_optional')}
          name="description"
          value={formValues.description}
          onChange={handleInputChange}
          sx={{ flex: 1 }}
          multiline
          rows={4}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">{t('ajenda.council_type_optional')}:</Typography>
          <FormControlLabel
            control={<Checkbox value="Subcouncil" checked={formValues.type === 'subcouncil'} onChange={handleCheckboxChange} />}
            label={t('ajenda.subcouncil')}
          />
          <FormControlLabel
            control={<Checkbox value="Main Council" checked={formValues.type === 'main council'} onChange={handleCheckboxChange} />}
            label={t('ajenda.main_council')}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={handleBackClick}>
          {t('ajenda.back')}
        </Button>
        <Button type="submit" variant="contained" color="primary">
          {t('ajenda.update')}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditAgendaStatus;
