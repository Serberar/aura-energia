import type { IAgendaRepository } from '@domain/repositories/IAgendaRepository';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

export class AgendaScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private agenda: IAgendaRepository,
    private wss: WebSocketServer,
  ) {}

  start(): void {
    // Chequea recordatorios cada 60 segundos
    this.timer = setInterval(() => this.checkReminders(), 60_000);
    console.log('[scheduler] AgendaScheduler started — checking reminders every 60s');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async checkReminders(): Promise<void> {
    try {
      const due = await this.agenda.findDueReminders(new Date());
      for (const entry of due) {
        this.wss.sendToAgent(entry.agentId, {
          type:  'agenda:reminder',
          entry: {
            id:          entry.id,
            clientPhone: entry.clientPhone,
            clientName:  entry.clientName,
            scheduledAt: entry.scheduledAt,
            notes:       entry.notes,
            priority:    entry.priority,
            saleId:      entry.saleId,
            clientId:    entry.clientId,
          },
        });
        await this.agenda.clearReminder(entry.id);
      }
    } catch (err) {
      console.error('[scheduler] Error checking reminders:', err);
    }
  }
}
