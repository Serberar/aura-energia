import type { CallRequestDTO } from '../dtos/CallRequestDTO';

export interface InitiateCallResult {
  providerCallId: string;
}

export interface ICallProvider {
  initiateCall(request: CallRequestDTO): Promise<InitiateCallResult>;
  hangUp(providerCallId: string): Promise<void>;
}
