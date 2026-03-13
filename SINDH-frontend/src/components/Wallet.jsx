import React from 'react';
import { useUser } from '../context/UserContext';
import WorkerWallet from './worker/WorkerWallet';
import EmployerWallet from './employer/EmployerWallet';

const Wallet = () => {
  const { user } = useUser();

  if (!user) return null;

  return user.type === 'employer' ? <EmployerWallet /> : <WorkerWallet />;
};

export default Wallet;




