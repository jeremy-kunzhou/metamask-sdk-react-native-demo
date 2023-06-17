import {AbstractConnector} from '@web3-react/abstract-connector';
import {ConnectorUpdate} from '@web3-react/types';

export const URI_AVAILABLE = 'URI_AVAILABLE';

export class UserRejectedRequestError extends Error {
  public constructor() {
    super();
    this.name = this.constructor.name;
    this.message = 'The user rejected the request.';
  }
}

export class MetamaskConnector extends AbstractConnector {
  private provider?: any;

  constructor({provider, supportedChainIds}: any) {
    super({supportedChainIds});
    this.provider = provider;
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

    console.log('connector activate function');

    console.log('activate', this.provider?.selectedAddress);
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
        console.log('metamask-connector deactivate');
      }

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
