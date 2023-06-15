import {AbstractConnector} from '@web3-react/abstract-connector';
import {ConnectorUpdate} from '@web3-react/types';
// import UniversalProvider from '@walletconnect/universal-provider';
// import WalletConnect from '@walletconnect/client';
// import WalletConnectProvider from './ethereum-provider';
// import {NETWORK_URLS} from '../../constants/config';
// import {IRPCMap} from '@walletconnect/types';

export const URI_AVAILABLE = 'URI_AVAILABLE';

// export interface WalletConnectConnectorArguments {
//   connector: WalletConnect;
//   infuraId?: string;
//   rpc?: IRPCMap;
//   supportedChainIds: number[];
//   chainId: number;
// }

export class UserRejectedRequestError extends Error {
  public constructor() {
    super();
    this.name = this.constructor.name;
    this.message = 'The user rejected the request.';
  }
}

export class WalletConnectConnector extends AbstractConnector {
  // public walletConnectProvider?: WalletConnectProvider;
  // private readonly connector: WalletConnect;
  // private chainId: number;
  // private readonly infuraId: string;
  // private readonly rpc: IRPCMap;
  private provider?: any;

  constructor({provider, supportedChainIds}: any) {
    super({supportedChainIds});
    this.provider = provider;
    // this.infuraId = infuraId;
    // this.chainId = chainId;
    // this.rpc = rpc;
    this.handleChainChanged = this.handleChainChanged.bind(this);
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.off = this.off.bind(this);
  }

  private handleChainChanged(chainId: number | string): void {
    if (__DEV__) {
      console.log("Handling 'chainChanged' event with payload", chainId);
    }
    this.emitUpdate({chainId});
  }

  private handleAccountsChanged(accounts: string[]): void {
    if (__DEV__) {
      console.log("Handling 'accountsChanged' event with payload", accounts);
    }
    this.emitUpdate({account: accounts[0]});
  }

  private handleDisconnect(): void {
    if (__DEV__) {
      console.log("Handling 'disconnect' event");
    }
    // we have to do this because of a @walletconnect/web3-provider bug
    if (this.provider) {
      this.provider.off('disconnect', this.handleDisconnect);
      this.provider.off('chainChanged', this.handleChainChanged);
      this.provider.off('accountsChanged', this.handleAccountsChanged);
      this.provider = undefined;
    }
    this.emitDeactivate();
  }

  public async activate(): Promise<ConnectorUpdate> {
    // TODO: make new universalProvider
    // if (!this.walletConnectProvider) {
    //   this.walletConnectProvider = new WalletConnectProvider({
    //     connector: this.connector,
    //     ...(this.infuraId ? {infuraId: this.infuraId} : {}),
    //     chainId: this.chainId,
    //     ...(this.rpc ? {rpc: this.rpc} : {}),
    //   });
    // }

    // let status: {
    //   accounts: string[];
    //   chainId: number;
    // };
    // ensure that the uri is going to be available, and emit an event if there's a new uri
    // jeremy: walletconnect connected before this class created
    // if (!this.walletConnectProvider.connector.connected) {
    // can't do createSession
    // await this.walletConnectProvider.connector.createSession(
    //   // this.config.chainId ? { chainId: this.config.chainId } : undefined,
    // )
    // follow the connector tutorial to use connect instead
    // https://docs.walletconnect.com/quick-start/dapps/react-native
    // status = await this.connector.connect()
    // this.chainId = status.chainId
    // status = await this.walletConnectProvider.connector.connect()
    // console.log(status)
    // no uri found
    // this.emit(URI_AVAILABLE, this.walletConnectProvider.connector.uri)
    // }

    console.log('connector activate function');

    console.log('aaa', this.provider?.selectedAddress);
    // let account: string
    const account = await new Promise<string>((resolve, reject) => {
      const userReject = () => {
        // Erase the provider manually
        this.provider = undefined;
        reject(new UserRejectedRequestError());
      };

      // Workaround to bubble up the error when user reject the connection
      this.provider?.on('disconnect', () => {
        // Check provider has not been enabled to prevent this event callback from being called in the future
        if (!account) {
          userReject();
        }
      });

      if (this.provider?.selectedAddress) {
        resolve(this.provider?.selectedAddress);
      }
      // resolve((await this.provider.enable())[0]);
      // can't use enable function because of no response
      // this.provider
      //   ?.enable()
      //   .then((accounts: string[]) => {
      //     console.log(accounts);
      //     resolve(accounts[0]);
      //   })
      //   .catch((error: Error): void => {
      //     // TODO ideally this would be a better check
      //     if (error.message === 'User closed modal') {
      //       userReject();
      //       return;
      //     }
      //     reject(error);
      //   });
    }).catch(err => {
      throw err;
    });

    this.provider?.on('disconnect', this.handleDisconnect);
    this.provider?.on('chainChanged', this.handleChainChanged);
    this.provider?.on('accountsChanged', this.handleAccountsChanged);

    if (__DEV__) {
      console.log('activate', {account});
    }

    return {provider: this.provider, account};
  }

  public async getProvider(): Promise<any> {
    return this.provider;
  }

  public async getChainId(): Promise<number | string> {
    // const chainId = await Promise.resolve(
    //   await this.provider?.request({method: 'eth_chainId'}),
    // );
    // if (__DEV__) {
    //   console.log('getChainId', {chainId});
    // }
    // return chainId as any;
    return this.provider?.chainId;
  }

  public async getAccount(): Promise<null | string> {
    // const account = Promise.resolve(
    //   (await this.provider?.request({method: 'eth_requestAccounts'})) as any,
    // ).then((accounts: string[]): string => accounts[0]);
    // if (__DEV__) {
    //   console.log('getAccount', {account});
    // }
    // return account;
    return this.provider?.selectedAddress;
  }

  public off(eventName: string | symbol, listener: (...args: any[]) => void) {
    if (this.provider) {
      this.provider.off(eventName.toString(), listener);
    }
    return this;
  }

  public deactivate() {
    if (!!this?.provider) {
      if (__DEV__) {
        console.log('walletconnect-connector deactivate');
      }
      // follow the connector tutorial for end session in case
      // https://docs.walletconnect.com/quick-start/dapps/react-native
      this.provider.disconnect();

      this.provider.off('disconnect', this.handleDisconnect);
      this.provider.off('chainChanged', this.handleChainChanged);
      this.provider.off('accountsChanged', this.handleAccountsChanged);
    }
  }

  public async close() {
    this.emitDeactivate();
  }
}
