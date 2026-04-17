import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FlownauIntegrationService } from './flownau.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FlownauIntegrationService', () => {
  let service: FlownauIntegrationService;

  const mockConfigGet = jest.fn((key: string, defaultVal?: string) => {
    const map: Record<string, string> = {
      FLOWNAU_URL: 'http://flownau-test:3000',
      NAU_SERVICE_KEY: 'test-service-key',
    };
    return map[key] ?? defaultVal ?? '';
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlownauIntegrationService,
        {
          provide: ConfigService,
          useValue: { get: mockConfigGet },
        },
      ],
    }).compile();

    service = module.get<FlownauIntegrationService>(FlownauIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestIdeas', () => {
    it('sends a POST to the correct Flownau URL with the right payload', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await service.ingestIdeas('brand-123', [
        { text: 'Idea about productivity', sourceRef: 'block-abc' },
      ]);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://flownau-test:3000/api/v1/ideas/ingest',
        {
          accountId: 'brand-123',
          source: 'captured',
          ideas: [{ text: 'Idea about productivity', sourceRef: 'block-abc' }],
        },
        {
          headers: {
            Authorization: 'Bearer test-service-key',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('sends source: "captured" for all ideas', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await service.ingestIdeas('brand-456', [
        { text: 'Idea 1' },
        { text: 'Idea 2', sourceRef: 'block-xyz' },
      ]);

      const callArgs = mockedAxios.post.mock.calls[0]!;
      const body = callArgs[1] as Record<string, unknown>;
      expect(body.source).toBe('captured');
      expect((body.ideas as unknown[]).length).toBe(2);
    });

    it('uses the NAU_SERVICE_KEY as a Bearer token', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      await service.ingestIdeas('brand-789', [{ text: 'Some idea' }]);

      const callArgs = mockedAxios.post.mock.calls[0]!;
      const headers = (callArgs[2] as { headers: Record<string, string> }).headers;
      expect(headers['Authorization']).toBe('Bearer test-service-key');
    });

    it('falls back to default FLOWNAU_URL when env var is not set', async () => {
      const fallbackConfigGet = jest.fn((key: string, defaultVal?: string) => {
        if (key === 'NAU_SERVICE_KEY') return 'some-key';
        return defaultVal ?? ''; // returns the default for FLOWNAU_URL
      });

      const fallbackModule: TestingModule = await Test.createTestingModule({
        providers: [
          FlownauIntegrationService,
          {
            provide: ConfigService,
            useValue: { get: fallbackConfigGet },
          },
        ],
      }).compile();

      const fallbackService =
        fallbackModule.get<FlownauIntegrationService>(FlownauIntegrationService);
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      await fallbackService.ingestIdeas('brand-001', [{ text: 'test' }]);

      const url = mockedAxios.post.mock.calls[0]![0] as string;
      expect(url).toBe('http://flownau:3000/api/v1/ideas/ingest');
    });

    it('throws and does not swallow errors when axios fails', async () => {
      const networkError = new Error('ECONNREFUSED');
      mockedAxios.post.mockRejectedValueOnce(networkError);

      await expect(
        service.ingestIdeas('brand-123', [{ text: 'Some idea' }]),
      ).rejects.toThrow('ECONNREFUSED');
    });

    it('throws when Flownau returns a non-2xx response', async () => {
      const axiosError = Object.assign(new Error('Request failed with status 401'), {
        response: { status: 401, data: { error: 'Unauthorized' } },
      });
      mockedAxios.post.mockRejectedValueOnce(axiosError);

      await expect(
        service.ingestIdeas('brand-123', [{ text: 'Some idea' }]),
      ).rejects.toThrow('Request failed with status 401');
    });
  });
});
