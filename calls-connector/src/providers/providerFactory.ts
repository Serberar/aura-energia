import { config } from '../config';
import type { ICallProvider } from './ICallProvider';
import { MockProvider } from './mock/MockProvider';
import { TwilioProvider } from './twilio/TwilioProvider';
import { VicidialProvider } from './vicidial/VicidialProvider';

let instance: ICallProvider | null = null;

export function getProvider(): ICallProvider {
  if (instance) return instance;

  switch (config.provider) {
    case 'twilio':   instance = new TwilioProvider();   break;
    case 'vicidial': instance = new VicidialProvider(); break;
    case 'mock':
    default:         instance = new MockProvider();     break;
  }

  console.log(`[connector] Provider loaded: ${config.provider}`);
  return instance;
}
