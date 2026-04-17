import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface FlownauIdeaInput {
  text: string;
  sourceRef?: string;
}

@Injectable()
export class FlownauIntegrationService {
  private readonly logger = new Logger(FlownauIntegrationService.name);
  private readonly baseUrl: string;
  private readonly serviceKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'FLOWNAU_URL',
      'http://flownau:3000',
    );
    this.serviceKey = this.configService.get<string>('NAU_SERVICE_KEY') || '';
  }

  /**
   * Ingests captured content ideas into Flownau.
   * The payload sets source: "captured" so Flownau assigns priority 1.
   * Throws on network failure so callers can record `flownauSyncStatus: 'error'`.
   */
  async ingestIdeas(
    accountId: string,
    ideas: FlownauIdeaInput[],
  ): Promise<void> {
    const url = `${this.baseUrl}/api/v1/ideas/ingest`;

    await axios.post(
      url,
      {
        accountId,
        source: 'captured',
        ideas,
      },
      {
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    this.logger.log(
      `[Flownau-Integration] Ingested ${ideas.length} idea(s) for account ${accountId}`,
    );
  }
}
