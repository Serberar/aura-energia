import axios from 'axios';
import { randomUUID } from 'crypto';
import type { ICallProvider, InitiateCallResult } from '../ICallProvider';
import type { CallRequestDTO } from '../../dtos/CallRequestDTO';
import type { CallEventDTO } from '../../dtos/CallEventDTO';
import { config } from '../../config';

const ANSWER_PROBABILITY = 0.80;

export class MockProvider implements ICallProvider {
  private activeSimulations = new Map<string, ReturnType<typeof setTimeout>>();

  async initiateCall(request: CallRequestDTO): Promise<InitiateCallResult> {
    const providerCallId = `mock-${randomUUID()}`;
    this.runSimulation(request, providerCallId);
    return { providerCallId };
  }

  async hangUp(providerCallId: string): Promise<void> {
    const timer = this.activeSimulations.get(providerCallId);
    if (timer) {
      clearTimeout(timer);
      this.activeSimulations.delete(providerCallId);
    }
  }

  private runSimulation(request: CallRequestDTO, providerCallId: string): void {
    const { callId, callbackUrl } = request;
    const willAnswer = Math.random() < ANSWER_PROBABILITY;

    const send = (event: CallEventDTO) => this.postEvent(callbackUrl, event);
    const evt = (type: CallEventDTO['event'], extra: Partial<CallEventDTO> = {}): CallEventDTO => ({
      callId,
      providerCallId,
      event: type,
      timestamp: new Date().toISOString(),
      ...extra,
    });

    // t+0s initiated
    send(evt('initiated'));

    // t+1s ringing
    const t1 = setTimeout(() => send(evt('ringing')), 1_000);
    this.activeSimulations.set(providerCallId, t1);

    if (willAnswer) {
      // t+4s answered
      setTimeout(() => {
        send(evt('answered'));

        const callDuration = 10 + Math.floor(Math.random() * 50);

        // t+4+duration completed
        setTimeout(() => {
          send(evt('completed', {
            duration: callDuration,
            disposition: 'answered',
          }));

          if (request.record) {
            setTimeout(() => {
              send(evt('recording', {
                recordingUrl: `https://mock-recordings.local/${providerCallId}.mp3`,
              }));
            }, 500);
          }

          this.activeSimulations.delete(providerCallId);
        }, callDuration * 1_000);
      }, 4_000);
    } else {
      // No answer: decide between busy or no-answer
      const isBusy = Math.random() < 0.3;
      setTimeout(() => {
        send(evt(isBusy ? 'busy' : 'no-answer', { disposition: isBusy ? 'busy' : 'no-answer' }));
        this.activeSimulations.delete(providerCallId);
      }, isBusy ? 3_000 : 25_000);
    }
  }

  private async postEvent(callbackUrl: string, event: CallEventDTO): Promise<void> {
    try {
      await axios.post(callbackUrl, event, {
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 5_000,
      });
    } catch {
      // Fire-and-forget: el conector no reintenta, calls-service es el responsable de la lógica
    }
  }
}
