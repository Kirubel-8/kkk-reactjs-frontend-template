import { Apartment, Business, Category, Description, Gavel, LibraryBooks, LocationOn, Map, MenuBook, Place } from '@mui/icons-material';
import { Box, Button, Card, Container, Grid, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const BaseData = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');

  const items = [
    {
      key: 'region',
      title: t('basedata.region'),
      description: t('basedata.thisIsRegionBaseData'),
      route: '/region',
      icon: <LocationOn sx={{ fontSize: 40, color: '#5C6BC0' }} />
    },
    {
      key: 'zone',
      title: t('basedata.zone'),
      description: t('basedata.thisIsZoneBaseData'),
      route: '/zone',
      icon: <Map sx={{ fontSize: 40, color: '#66BB6A' }} />
    },
    {
      key: 'woreda',
      title: t('basedata.woreda'),
      description: t('basedata.thisIsWoredaBaseData'),
      route: '/woreda',
      icon: <Place sx={{ fontSize: 40, color: '#FFA726' }} />
    },
    {
      key: 'city',
      title: t('basedata.city'),
      description: t('basedata.thisIsCityBaseData'),
      route: '/city',
      icon: <Apartment sx={{ fontSize: 40, color: '#AB47BC' }} />
    },
    {
      key: 'subCity',
      title: t('basedata.sub-city'),
      description: t('basedata.thisIsSubCityBaseData'),
      route: '/sub-city',
      icon: <Business sx={{ fontSize: 40, color: '#42A5F5' }} />
    },
    {
      key: 'documentCategory',
      title: t('basedata.documentCategory'),
      description: t('basedata.thisIsDocumentCategoryBaseData'),
      route: '/document_category',
      icon: <Category sx={{ fontSize: 40, color: '#FF7043' }} />
    },
    {
      key: 'documentType',
      title: t('basedata.documentType'),
      description: t('basedata.thisIsDocumentTypeBaseData'),
      route: '/document_type',
      icon: <Description sx={{ fontSize: 40, color: '#26A69A' }} />
    },
    {
      key: 'caseType',
      title: t('basedata.caseType'),
      description: t('basedata.thisIsCaseTypeBaseData'),
      route: '/case_type',
      icon: <Gavel sx={{ fontSize: 40, color: '#964B00' }} />
    },
    {
      key: 'ajendaType',
      title: t('basedata.ajendaType'),
      description: t('basedata.thisIsAjendaTypeBaseData'),
      route: '/ajenda',
      icon: <LibraryBooks sx={{ fontSize: 40, color: '#003366' }} />
    },
    {
      key: 'ajendaStatusType',
      title: t('basedata.ajendaStatusType'),
      description: t('basedata.thisIsajendaStatusTypeBaseData'),
      route: '/ajenda-status',
      icon: <MenuBook sx={{ fontSize: 40, color: '#808080' }} />
    },
    {
      key: 'courtCategory',
      title: t('basedata.court-category'),
      description: t('basedata.thisIsCourtCategoryBaseData'),
      route: '/court-category',
      icon: <Apartment sx={{ fontSize: 40, color: '#AB47BC' }} />
    },
    {
      key: 'courtOffice',
      title: t('basedata.court-office'),
      description: t('basedata.thisIsCourtOfficeBaseData'),
      route: '/court-office',
      icon: <Business sx={{ fontSize: 40, color: '#42A5F5' }} />
    },
  ];

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ p: 4, backgroundColor: '#f9f9f9', borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'grey.400' }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            mb: 4,
            textAlign: 'center'
          }}
        >
          {t('basedata.management')}
        </Typography>

        <TextField
          label={t('basedata.searchPlaceholder')}
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            mb: 4,
            '& .MuiInputLabel-root': {
              color: 'text.secondary',
              fontWeight: 'normal'
            }
          }}
        />
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} key={item.key}>
              <Card
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  cursor: 'pointer',
                  borderRadius: 8,
                  transition: 'all 0.3s ease',
                  ':hover': { backgroundColor: '#f0f0f0', transform: 'scale(1.02)' }
                }}
                onClick={() => navigate(item.route)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    mr: 2
                  }}
                >
                  {item.icon}
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: '#212121'
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: 'text.secondary'
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(item.route)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 'bold',
                    borderRadius: 8
                  }}
                >
                  {t('basedata.view')}
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default BaseData;
