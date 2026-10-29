import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { getSession } from 'common/common';
import SaveIcon from '@mui/icons-material/Save';
import CircularProgress from '@mui/material/CircularProgress';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import MedicationIcon from '@mui/icons-material/Medication';
import MasksIcon from '@mui/icons-material/Masks';

const MaterialButton = ({ title, colorbutton, onClick, icon, privilegeName }) => {
  const [isStatus, setStatus] = useState(true);
  const [isClassButton, setClassButton] = useState('text-uppercase btn ');
  const privilegios = JSON.parse(getSession('PRIVILEGIOS'));
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    setStatus(true);
    await onClick();
    setIsLoading(false);
    setStatus(false);
  };

  useEffect(() => {
    setIsLoading(false);
    setStatus(EvaluarPrivilegio(privilegeName));
    setClassButton(isClassButton + colorbutton);
  }, [colorbutton]); // Asegúrate de que useEffect se ejecute solo cuando cambie colorbutton

  function EvaluarPrivilegio(privilegeName) {
    let estado = true;
    if (privilegeName === undefined || privilegeName === null) {
      estado = false;
    } else {
      estado = !privilegios.some((item) => item.code === privilegeName);
    }
    return estado;
  }
  // Renderiza el icono basado en la prop 'icon'
  const renderIcon = () => {
    if (isLoading) {
      return <CircularProgress size={24} color="inherit" />;
    } else if (icon) {
      switch (icon) {
        case 'search':
          return <SearchIcon />;
        case 'edit':
          return <EditIcon />;
        case 'delete':
          return <DeleteIcon />;
        case 'export':
          return <FileDownloadIcon />;
        case 'clean':
          return <CleaningServicesIcon />;
        case 'eye':
          return <RemoveRedEyeIcon />;
        case 'save':
          return <SaveIcon />;
        case 'time':
          return <AccessTimeIcon/>;
        case 'calendary':
          return <CalendarMonthIcon/>
        case 'back':
          return <KeyboardArrowLeftIcon/>
        case 'user':
          return <PersonIcon/>
        case 'info' : 
          return <InfoIcon/>
        case 'vehicle':
          return <DirectionsCarIcon/>
        case 'medication':
          return <MedicationIcon/>
        case 'alergia':
          return <MasksIcon/>
        // Agrega más casos para otros iconos aquí
        default:
          return null; // Si el icono no está definido, no muestra ningún icono
      }
    } else {
      return null;
    }
  };

  return (
    <>
      <button disabled={isStatus} className={isClassButton} onClick={handleClick}>
        {renderIcon()}
        {title}
      </button>
    </>
  );
};

MaterialButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  colorbutton: PropTypes.string,
  icon: PropTypes.oneOf(['search', 'edit', 'delete', 'export', 'save', 'clean', 'eye' , 'time','calendary', 'back' , 'user' , 'info' , 'vehicle' , 'medication', 'alergia' /* Agrega otros nombres de iconos aquí */])
};

export default MaterialButton;
