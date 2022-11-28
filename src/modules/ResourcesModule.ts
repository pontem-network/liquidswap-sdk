import { SDK } from '../sdk';
import { IModule } from '../interfaces/IModule';
import { AptosResource, AptosResourceType } from '../types/aptos';
import { isAxiosError } from '../utils/is';

export class ResourcesModule implements IModule {
  protected _sdk: SDK;

  get sdk() {
    return this._sdk;
  }

  constructor(sdk: SDK) {
    this._sdk = sdk;
  }

  async fetchAccountResource<T = unknown>(
    accountAddress: string,
    resourceType: AptosResourceType,
  ): Promise<AptosResource<T> | undefined> {
    try {
      const response = await this._sdk.client.getAccountResource(
        accountAddress,
        resourceType,
      );
      return response as unknown as AptosResource<T>;
    } catch (e: unknown) {
      if (isAxiosError(e)) {
        if (e.response?.status === 404) {
          return undefined;
        }
      }

      throw e;
    }
  }
}
