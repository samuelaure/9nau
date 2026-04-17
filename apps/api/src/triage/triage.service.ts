import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { BlocksService } from '../blocks/blocks.service';
import { NauthenticityService } from '../integrations/nauthenticity.service';
import { FlownauIntegrationService } from '../integrations/flownau.service';

const TriageResultSchema = z.object({
  segments: z.array(z.object({
    category: z.enum([
      'action', 'project', 'habit', 'appointment', 
      'someday_maybe', 'reference', 'content_idea'
    ]),
    reasoning: z.string(),
    text: z.string(),
    // Conditional extracted fields based on category
    metadata: z.object({
      priority: z.enum(['low', 'medium', 'high']).optional(),
      deadline: z.string().optional(), // ISO date or descriptive
      brandId: z.string().optional(),
      brandName: z.string().optional(),
      frequency: z.string().optional(),
      topic: z.string().optional(),
    }).optional()
  })),
  journalSummary: z.string()
});

export type TriageResult = z.infer<typeof TriageResultSchema>;

@Injectable()
export class TriageService {
  private readonly logger = new Logger(TriageService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly blocksService: BlocksService,
    private readonly nauthenticityService: NauthenticityService,
    private readonly flownauService: FlownauIntegrationService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not found. AI Triage will be disabled.');
    }
  }

  async processRawText(text: string, userId: string, sourceBlockId?: string) {
    if (!this.openai) {
      throw new Error('AI Triage is disabled due to missing configuration.');
    }

    try {
      // 1. Fetch Context (Active Projects, Brands)
      const [brands, recentBlocks] = await Promise.all([
        this.nauthenticityService.getBrands(userId),
        this.blocksService.findAll({}), // Try to get recent blocks context
      ]);

      const activeProjects = recentBlocks
        .filter(b => b.type === 'project' && (b.properties as any)?.status !== 'done')
        .slice(0, 10)
        .map(b => `- ${(b.properties as any)?.name || 'Untitled'} (ID: ${b.id})`)
        .join('\n');

      const userBrands = brands.map((b: any) => `- ${b.brandName} (ID: ${b.id}) - Voice: ${b.voicePrompt}`).join('\n');

      // 2. Call OpenAI using structured output
      this.logger.log(`Calling OpenAI for triage... Context: ${brands.length} brands, active projects.`);

      const completion = await (this.openai.beta as any).chat.completions.parse({
        model: 'gpt-4o',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: `You are an expert AI productivity assistant. Your job is to listen to raw voice captures or scattered notes and triage them into structured segments. 
You act as a Second Brain router.

CATEGORIES ALLOWED:
- action: A concrete, actionable task. Extract priority and deadline if mentioned.
- project: A larger goal with multiple steps. 
- habit: A recurring behavior.
- appointment: A scheduled event or meeting. Extract datetime.
- someday_maybe: An idea to do someday but not actionable soon.
- reference: Useful knowledge, facts, or information to keep. Extract topic.
- content_idea: A creative idea for social media/creator content. Detect if it applies to one of the user's brands.

YOUR CONTEXT:
Active Projects:
${activeProjects || 'No active projects found.'}

User Brands:
${userBrands || 'No brands registered.'}

RULES:
1. Break down the user's input into logical segments. Each segment should have exactly ONE category.
2. If a segment is an idea for social media, map it to 'content_idea'. If it relates to a Brand from context, populate brandId and brandName.
3. If an action could belong to a project, note the project topic.
4. You MUST ALWAYS write a 'journalSummary'. This is a well-written, reflective summary of what the user talked about, synthesizing the entry as a whole. Keep it brief but descriptive, written in the third person or first person from the user's prompt point of view.

OUTPUT: Return valid JSON matching the schema.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: zodResponseFormat(TriageResultSchema, 'TriageResult'),
      });

      const parsed = completion.choices[0].message.parsed;
      if (!parsed) {
        throw new Error('Failed to parse AI response');
      }

      // 3. Save Blocks based on triage extraction
      const createdBlocks = await this.saveTriagedBlocks(parsed, sourceBlockId);

      return {
        success: true,
        summary: `Procesé tu texto: ${parsed.segments.length} bloques creados. Diario actualizado.`,
        blocks: createdBlocks,
        rawResult: parsed
      };
    } catch (error) {
      this.logger.error('Error during triage processing', error);
      throw error;
    }
  }

  private async saveTriagedBlocks(result: TriageResult, sourceBlockId?: string) {
    const createdBlocks = [];

    // Save segments
    for (const segment of result.segments) {
      const type = segment.category;
      
      const properties: any = {
        text: segment.text,
        reasoning: segment.reasoning,
        source: 'triage_engine',
        status: 'todo' // Default status for actions/projects
      };

      if (segment.category === 'action' && segment.metadata) {
        properties.priority = segment.metadata.priority;
        properties.deadline = segment.metadata.deadline;
      }
      
      if (segment.category === 'project') {
        properties.name = segment.text;
      }

      if (segment.category === 'content_idea' && segment.metadata) {
        properties.brandId = segment.metadata.brandId;
        properties.brandName = segment.metadata.brandName;
        properties.flownauSyncStatus = 'pending';
      }

      const block = await this.blocksService.create({
        type,
        properties
      });

      // Forward content_idea blocks with a mapped brand to Flownau
      if (segment.category === 'content_idea' && properties.brandId) {
        try {
          await this.flownauService.ingestIdeas(properties.brandId, [
            { text: segment.text, sourceRef: block.id },
          ]);
          await this.blocksService.update(block.id, {
            properties: { flownauSyncStatus: 'success' },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `[Flownau-Integration-Error] Failed to ingest idea block ${block.id}: ${msg}`,
          );
          await this.blocksService.update(block.id, {
            properties: { flownauSyncStatus: 'error' },
          });
        }
      }

      createdBlocks.push(block);
    }

    // Save Journal Summary
    if (result.journalSummary) {
      const journalBlock = await this.blocksService.create({
        type: 'journal_entry',
        properties: {
          summary: result.journalSummary,
          date: new Date().toISOString(),
          sourceBlockId
        }
      });
      createdBlocks.push(journalBlock);
    }

    return createdBlocks;
  }

  async retroprocess(userId: string) {
    const captures = await this.blocksService.findAll({ type: 'voice_capture' });
    
    const pendingCaptures = captures.filter(b => {
      const props = b.properties as any;
      return !props?.triageStatus || props?.triageStatus === 'pending';
    });

    this.logger.log(`Found ${pendingCaptures.length} pending voice captures for retroprocessing.`);

    const results = [];
    for (const capture of pendingCaptures) {
      try {
        const text = (capture.properties as any)?.text;
        if (!text) {
           await this.blocksService.update(capture.id, {
             properties: { triageStatus: 'error', error: 'No text found' }
           });
           continue;
        }

        const result = await this.processRawText(text, userId, capture.id);
        
        await this.blocksService.update(capture.id, {
           properties: { triageStatus: 'processed' }
        });

        results.push({ id: capture.id, success: true, blocksCreated: result.blocks.length });
      } catch (error) {
        this.logger.error(`Failed to retroprocess capture ${capture.id}`, error);
        await this.blocksService.update(capture.id, {
           properties: { triageStatus: 'error', error: String(error) }
        });
        results.push({ id: capture.id, success: false, error: String(error) });
      }
    }

    return {
      processedCount: results.length,
      results
    };
  }
}
