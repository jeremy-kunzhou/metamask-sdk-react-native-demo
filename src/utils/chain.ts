import {useEffect, useState, useMemo, useCallback} from 'react';

import {useWeb3React} from '@web3-react/core';
import {JsonRpcSigner, Web3Provider} from '@ethersproject/providers';
import {Contract} from '@ethersproject/contracts';
import {ethers, providers, Signer, Wallet} from 'ethers';
import ERC20_ABI from '../abi/erc20.json';
import {useRefresh} from '../context/RefreshContext';

export function getSigner(
  library: Web3Provider,
  account: string,
): JsonRpcSigner {
  // create JsonRpcSigner
  return library.getSigner(account).connectUnchecked();
}

export function getProviderOrSigner(
  library: Web3Provider,
  account?: string,
): Web3Provider | JsonRpcSigner | Wallet {
  if (library instanceof Signer && library._isSigner) {
    return library;
  } else {
    return account ? getSigner(library as any, account) : library;
  }
}

// account is optional
export function getContract(
  address: string,
  ABI: any,
  library: Web3Provider,
  account?: string,
): Contract {
  if (!address) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }

  return new Contract(
    address,
    ABI,
    getProviderOrSigner(library, account) as any,
  );
}

export function useContract(
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true,
): Contract | null {
  const {library, account, chainId} = useWeb3React();
  return useMemo(() => {
    if (!address || !ABI || !library || !chainId) return null;
    try {
      return getContract(
        address,
        ABI,
        library,
        withSignerIfPossible && account ? account : undefined,
      );
    } catch (error) {
      console.error('Failed to get contract', error);
      return null;
    }
  }, [address, ABI, library, withSignerIfPossible, account, chainId]);
}

export function useTokenContractForReading(
  tokenAddress?: string,
): Contract | null {
  return useContract(tokenAddress, ERC20_ABI);
}
export const ETHER_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export function useTokenBalance(tokenAddress?: string): string {
  const [balance, setBalance] = useState<string>('0');
  const {fastRefresh} = useRefresh();
  const {account, chainId, library} = useWeb3React();
  // const currentBlockNumber = useBlockNumber()
  // allows balance to update given transaction updates
  // const currentTransactionStatus = useTransactionStatus()

  const tokenContract = useTokenContractForReading(tokenAddress || undefined);

  const fetchBalance = useCallback(async () => {
    const getBalance = async (
      contract: Contract | null,
      owner: string | null | undefined,
    ): Promise<string> => {
      try {
        console.log(account, chainId, contract?.address, !!library);
        if (account && chainId && contract?.address === ETHER_ADDRESS) {
          console.log('call');
          const ethBalance = await library?.getBalance(account);
          console.log('aftercall', ethBalance);
          return ethBalance.toString();
        }

        const balance = await contract?.balanceOf(owner);
        // const decimals = await contract?.decimals();

        return balance.toString();
      } catch (e) {
        console.log('getBalance', e);
        return '0';
      }
    };
    console.log('fetchBalance');
    const balance = await getBalance(tokenContract, account);
    setBalance(balance);
  }, [account, tokenContract, chainId, library]);

  useEffect(() => {
    if (account && tokenContract) {
      fetchBalance();
    }
  }, [account, fetchBalance, tokenContract, fastRefresh]);

  return balance;
}

export const signMessageAsync = async (
  signer: Signer,
  address: string,
  message: string,
): Promise<{signature: string; message: string}> => {
  const messageBytes = ethers.utils.toUtf8Bytes(message);
  if (signer instanceof providers.JsonRpcSigner) {
    try {
      console.log('sign method 1');
      const signature = await signer.provider.send('personal_sign', [
        ethers.utils.hexlify(messageBytes),
        address.toLowerCase(),
      ]);
      return {signature, message};
    } catch (e: any) {
      if (e.message.includes('personal_sign')) {
        console.log('sign method 2');
        return {signature: await signer.signMessage(messageBytes), message};
      }
      throw e;
    }
  } else {
    // console.log("sign method 3")
    return {signature: await signer.signMessage(messageBytes), message};
  }
};
