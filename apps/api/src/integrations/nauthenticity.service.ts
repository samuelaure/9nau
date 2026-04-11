import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NauthenticityService {
  private readonly logger = new Logger(NauthenticityService.name);
  private readonly baseUrl: string;
  private readonly serviceKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'NAUTHENTICITY_URL',
      'http://nauthenticity:4000',
    );
    this.serviceKey = this.configService.get<string>('NAU_SERVICE_KEY') || '';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.serviceKey}`,
    };
  }

  async addTargets(brandId: string, usernames: string[]) {
    this.logger.log(
      `Adding targets to Nauthenticity for brand ${brandId}: ${usernames.join(', ')}`,
    );
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/targets`,
        { brandId, usernames },
        { headers: this.headers },
      );
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to add targets: ${message}`);
      throw error;
    }
  }

  async generateComment(targetUrl: string, brandId: string) {
    this.logger.log(
      `Generating reactive comment for ${targetUrl} (Brand: ${brandId})`,
    );
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/generate-comment`,
        { targetUrl, brandId },
        { headers: this.headers },
      );
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate comment: ${message}`);
      throw error;
    }
  }

  async getBrands(userId: string) {
    this.logger.log(`Fetching brands for user: ${userId}`);
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/brands`,
        { 
          params: { userId },
          headers: this.headers 
        },
      );
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch brands: ${message}`);
      // Fallback: return empty array if unreachable so triage doesn't fail
      return [];
    }
  }
}
