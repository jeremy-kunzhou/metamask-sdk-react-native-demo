import React, {useEffect, useState} from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Linking,
  LogBox,
  AppState,
  AppStateStatus,
} from 'react-native';

// @ts-expect-error - `@env` is a virtualised module via Babel config.
import {ENV_PROJECT_ID} from '@env';

import {useWeb3React} from '@web3-react/core';
import {WalletConnectConnector} from './WalletConnectV2/walletconnect-connector';
import {MetaMaskSDK} from '@metamask/sdk';
import {
  CommunicationLayerMessage,
  CommunicationLayerPreference,
  DappMetadata,
  MessageType,
  RemoteCommunication,
} from '@metamask/sdk-communication-layer';

import {
  ETHER_ADDRESS,
  getSigner,
  signMessageAsync,
  useTokenBalance,
  useTokenContractForReading,
} from './utils/chain';
import {Provider} from './Provider';
import {testSignTransaction} from './utils/MethodUtil';
import {ethers} from 'ethers';
import BackgroundTimer from 'react-native-background-timer';
import {Colors} from 'react-native/Libraries/NewAppScreen';

// const SUPPORT_CHAIN_ID = [137, 56];
const SUPPORT_CHAIN_ID = [80001, 97];
// const SUPPORT_CHAIN_ID = [1];

LogBox.ignoreLogs([]); // Ignore log notification by message

// TODO how to properly make sure we only try to open link when the app is active?
// current problem is that sdk declaration is outside of the react scope so I cannot directly verify the state
// hence usage of a global variable.
let canOpenLink = true;

const sdk = new MetaMaskSDK({
  openDeeplink: (link: string) => {
    if (canOpenLink) {
      Linking.openURL(link);
    }
  },
  timer: BackgroundTimer,
  enableDebug: true,
  dappMetadata: {
    url: 'ReactNativeTS',
    name: 'ReactNativeTS',
  },
  storage: {
    enabled: true,
  },
});

function Main() {
  const {
    account,
    deactivate,
    // connector,
    activate,
    active,
    error,
    library,
    chainId,
  } = useWeb3React();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppState = (appState: AppStateStatus) => {
    console.debug(`AppState change: ${appState}`);
    canOpenLink = appState === 'active';
  };

  const backgroundStyle = {
    backgroundColor: Colors.lighter,
  };
  const isDarkMode = useColorScheme() === 'dark';
  const [clientId, setClientId] = useState<string>();

  const onCopy = (value: string) => {
    Alert.alert('Copied to clipboard');
  };

  const etherBalance = useTokenBalance(ETHER_ADDRESS);

  const tokenBalance = useTokenBalance(
    '0xFEc560AeAFC1515a4135e392c8db47F0EcfBDDeA',
  );

  const tokenContract = useTokenContractForReading(
    '0xFEc560AeAFC1515a4135e392c8db47F0EcfBDDeA',
  );

  useEffect(() => {
    console.log({tokenBalance});
  }, [tokenBalance]);

  // useEffect(() => {
  //   async function getClientId() {
  //     if (provider && isConnected) {
  //       const _clientId = await provider?.client?.core.crypto.getClientId();
  //       setClientId(_clientId);
  //     } else {
  //       setClientId(undefined);
  //     }
  //   }

  //   getClientId();
  // }, [isConnected, provider]);

  // useEffect(() => {
  //   if (provider && isConnected) {
  //     console.log({
  //       isConnected,
  //       provider,
  //     });
  //     activate(
  //       new WalletConnectConnector({
  //         provider,
  //         supportedChainIds: SUPPORT_CHAIN_ID,
  //       }),
  //     )
  //       .then(data => console.log('activate', data))
  //       .catch(error => console.log(error))
  //       .finally(() => console.log('activate finished'));
  //   }
  // }, [isConnected, provider, activate]);

  useEffect(() => {
    console.log('account', account);
  }, [account]);

  useEffect(() => {
    console.log('chainId', chainId);
  }, [chainId]);

  useEffect(() => {
    console.log({active, error});
  }, [active, error]);

  const [ethereum] = useState(sdk.getProvider());

  const connect = async () => {
    try {
      const result = (await ethereum?.request({
        method: 'eth_requestAccounts',
      })) as string[];
      console.log('RESULT', result?.[0]);
      activate(
        new WalletConnectConnector({
          provider: ethereum,
          supportedChainIds: SUPPORT_CHAIN_ID,
        }),
      )
        .then(data => console.log('activate', data))
        .catch(error => console.log(error))
        .finally(() => console.log('activate finished'));
    } catch (e) {
      console.log('ERROR', e);
    }
  };

  const open = () => {
    connect();
  };

  return (
    <SafeAreaView style={[styles.safeArea]}>
      <View style={[styles.container]}>
        <View style={styles.centerContainer}>
          {account && (
            <Text>
              {account} {chainId}
            </Text>
          )}
          {etherBalance && (
            <Text>
              ETH {etherBalance} {ethers.utils.formatEther(etherBalance)}
            </Text>
          )}
          {tokenBalance && <Text>Token {tokenBalance}</Text>}
          <TouchableOpacity onPress={() => open()} style={styles.button}>
            <Text>Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              await tokenContract
                ?.transfer(account, '10000')
                .then(result => {
                  console.log(result);
                })
                .catch(error => console.log(error));
            }}
            style={styles.button}>
            <Text>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              testSignTransaction(library as any);
            }}
            style={styles.button}>
            <Text>Sign TX</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              const signer = getSigner(library, account as any);

              const result = signMessageAsync(
                signer,
                account as any,
                'Hello, web3',
              );

              console.log('sign', {result});
            }}
            style={styles.button}>
            <Text>Sign</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              deactivate();
              sdk.terminate();
            }}
            style={styles.button}>
            <Text>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function App() {
  return (
    <Provider>
      <Main />
    </Provider>
  );
}

export default App;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 64,
    padding: 16,
    // borderColor: LightTheme.accent,
    // backgroundColor: LightTheme.background2,
    borderWidth: 1,
    borderRadius: 16,
    // shadowColor: LightTheme.foreground1,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    elevation: 4,
  },
  cardDark: {
    // backgroundColor: DarkTheme.background2,
    // borderColor: DarkTheme.accent,
    // shadowColor: DarkTheme.foreground1,
    shadowOpacity: 0.5,
  },
  propTitle: {
    fontWeight: 'bold',
  },
  propValue: {
    fontWeight: 'normal',
  },
  darkText: {
    // color: DarkTheme.foreground1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  centerContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  web3Button: {
    width: 180,
  },
  button: {
    padding: 16,
    borderWidth: 1,
    marginVertical: 10,
    backgroundColor: 'green',
  },
});
