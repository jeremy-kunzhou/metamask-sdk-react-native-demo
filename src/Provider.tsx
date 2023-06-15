import React from 'react';
import {RefreshContextProvider} from './context/RefreshContext';
import {Web3ReactProvider} from '@web3-react/core';
import {ethers} from 'ethers';
function getLibrary(provider: any): ethers.providers.Web3Provider {
  const library = new ethers.providers.Web3Provider(provider, 'any');
  library.pollingInterval = 15000;
  return library;
}

export const Provider: React.FC<React.PropsWithChildren> = ({children}) => {
  return (
    <RefreshContextProvider>
      <Web3ReactProvider getLibrary={getLibrary}>{children}</Web3ReactProvider>
    </RefreshContextProvider>
  );
};
