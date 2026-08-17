import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GatePassFormModal from '../components/GatePassFormModal.jsx';

export default function NewGatePassPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    navigate('/');
  };

  return open ? (
    <GatePassFormModal onClose={handleClose} />
  ) : null;
}
