import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DepartmentService from '../../../service/department.service';
import TeamService from '../../../service/team.service';

const AddTeam = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    name: '',
    department_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const departmentData = await DepartmentService.getAllDepartments();
        setDepartments(departmentData);
      } catch (error) {
        console.error('Failed to fetch departments:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) {
      message = 'Team name is required';
    }
    if (name === 'department_id' && !value) {
      message = 'Please select a department';
    }
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
    validateField(name, value);
  };

  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all fields before submitting
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      try {
        await TeamService.createTeam(formValues);
        setSnackbar({
          open: true,
          message: 'Team registered successfully!',
          severity: 'success'
        });
        setTimeout(() => {
          navigate('/team');
        }, 1500);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to register team. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleBackClick = () => {
    navigate('/team');
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '99%',
        ml: 1,
        p: 4,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Team Registration
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: 1 }} disabled={loading} error={!!formErrors.department_id && touched.department_id}>
          <InputLabel>Department</InputLabel>
          <Select
            label="Department"
            name="department_id"
            value={formValues.department_id}
            onChange={handleInputChange}
            onFocus={() => handleFocus('department_id')}
            onBlur={() => validateField('department_id', formValues.department_id)}
            required
          >
            <MenuItem value="">
              <em>Select a Department</em>
            </MenuItem>
            {departments.map((department) => (
              <MenuItem key={department.department_id} value={department.department_id}>
                {department.name}
              </MenuItem>
            ))}
          </Select>
          {formErrors.department_id && touched.department_id ? (
            <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <CloseCircleOutlined style={{ marginRight: '4px' }} />
              {formErrors.department_id}
            </Typography>
          ) : (
            formValues.department_id && (
              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CheckCircleOutlined style={{ marginRight: '4px' }} />
                Looks good!
              </Typography>
            )
          )}
        </FormControl>
        <TextField
          label="Team Name"
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
            ) : (
              formValues.name && (
                <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                  <CheckCircleOutlined style={{ marginRight: '4px' }} />
                  Looks good!
                </span>
              )
            )
          }
          sx={{ flex: 1 }}
          required
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={handleBackClick}>
          Back
        </Button>
        <Button type="submit" variant="contained" color="primary">
          Submit
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

export default AddTeam;
