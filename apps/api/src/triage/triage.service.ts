import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { BlocksService } from '../blocks/blocks.service';
import { NauthenticityService } from '../integrations/nauthenticity.service';
import { FlownauIntegrationService } from '../integrations/flownau.service';
import { PrismaService } from '../prisma/prisma.service';

const TriageResultSchema = z.object({
  segments: z.array(z.object({
    category: z.enum([
      'action', 'project', 'habit', 'appointment',
      'someday_maybe', 'reference', 'content_idea'
    ]),
    reasoning: z.string(),
    text: z.string(),
    metadata: z.object({
      priority: z.enum(['low', 'medium', 'high']).nullable().optional(),
      deadline: z.string().nullable().optional(),
      brandId: z.string().nullable().optional(),
      brandName: z.string().nullable().optional(),
      frequency: z.string().nullable().optional(),
      topic: z.string().nullable().optional(),
    }).nullable().optional()
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
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not found. AI Triage will be disabled.');
    }
  }

  async processRawText(
    text: string,
    userId: string,
    sourceBlockId?: string,
    brandId?: string | null,
    workspaceId?: string,
  ) {
    if (!this.openai) {
      throw new Error('AI Triage is disabled due to missing configuration.');
    }

    try {
      // 1. Fetch context — projects + brand DNA
      const recentBlocks = await this.blocksService.findAll({});

      const activeProjects = recentBlocks
        .filter(b => b.type === 'project' && (b.properties as any)?.status !== 'done')
        .slice(0, 10)
        .map(b => `- ${(b.properties as any)?.name || 'Untitled'} (ID: ${b.id})`)
        .join('\n');

      // 2. Resolve workspaceId from DB if not supplied
      let resolvedWorkspaceId = workspaceId;
      if (!resolvedWorkspaceId) {
        const user = await this.prisma.user.findFirst({
          where: {
            OR: [
              { id: userId },
              { telegramId: userId },
            ],
          },
          include: { workspaces: { take: 1 } },
        });
        resolvedWorkspaceId = user?.workspaces?.[0]?.workspaceId;
      }

      // 3. Determine brand context and whether AI routing is needed
      let brandsForPrompt: Array<{ id: string; brandName: string; voicePrompt: string }> = [];
      let aiRoutingEnabled = false;

      if (brandId) {
        // Explicit brand selected by user — fetch its dna-light for context, no AI routing needed
        const dna = await this.nauthenticityService.getBrandDnaLight(brandId);
        if (dna) brandsForPrompt = [dna];
      } else if (resolvedWorkspaceId) {
        // No brand selected → fetch all workspace brands for AI detection
        brandsForPrompt = await this.nauthenticityService.getBrandsForWorkspace(resolvedWorkspaceId);
        aiRoutingEnabled = brandsForPrompt.length > 0;
      }

      const brandsSection = brandsForPrompt.length > 0
        ? brandsForPrompt.map(b => `- ${b.brandName} (ID: ${b.id})\n  Voice/DNA: ${b.voicePrompt}`).join('\n')
        : 'No brands registered.';

      // 4. Build system prompt
      const aiRoutingNote = aiRoutingEnabled
        ? `\nIMPORTANT — AI BRAND ROUTING: The user did NOT specify a brand. You MUST analyze each content_idea segment and match it to the most fitting brand using the Brand DNA above. Populate brandId and brandName based on which brand the idea best aligns with. If no brand fits, leave brandId empty.`
        : brandId
          ? `\nBrand context provided: all content_ideas should be linked to the brand with ID "${brandId}" unless clearly unrelated.`
          : '';

      // 5. Call OpenAI
      this.logger.log(`Calling OpenAI for triage... Brands: ${brandsForPrompt.length}, AI routing: ${aiRoutingEnabled}`);

      const completion = await this.openai.chat.completions.parse({
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
${brandsSection}
${aiRoutingNote}

RULES:
1. Break down the user's input into logical segments. Each segment should have exactly ONE category.
2. If a segment is an idea for social media, map it to 'content_idea'. Populate brandId and brandName if a matching brand is found.
3. If an action could belong to a project, note the project topic.
4. You MUST ALWAYS write a 'journalSummary'. Keep it brief and reflective.

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

      // 6. Save blocks — pass through explicit brandId and aiRouting flag
      const createdBlocks = await this.saveTriagedBlocks(parsed, sourceBlockId, brandId, aiRoutingEnabled);

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

  private async saveTriagedBlocks(
    result: TriageResult,
    sourceBlockId?: string,
    explicitBrandId?: string | null,
    aiRoutingEnabled = false,
  ) {
    const createdBlocks = [];

    for (const segment of result.segments) {
      const type = segment.category;

      const properties: any = {
        text: segment.text,
        reasoning: segment.reasoning,
        source: 'triage_engine',
        status: 'todo',
      };

      if (segment.category === 'action' && segment.metadata) {
        properties.priority = segment.metadata.priority;
        properties.deadline = segment.metadata.deadline;
      }

      if (segment.category === 'project') {
        properties.name = segment.text;
      }

      if (segment.category === 'content_idea') {
        // Prefer explicit brandId from user selection; fall back to AI-detected one
        const resolvedBrandId = explicitBrandId ?? segment.metadata?.brandId ?? null;
        const resolvedBrandName = segment.metadata?.brandName ?? null;

        // aiLinked = true when brand was detected by AI (no explicit selection)
        const aiLinked = resolvedBrandId !== null && !explicitBrandId && aiRoutingEnabled;

        properties.brandId = resolvedBrandId;
        properties.brandName = resolvedBrandName;
        properties.aiLinked = aiLinked;
        properties.flownauSyncStatus = 'pending';
      }

      const block = await this.blocksService.create({ type, properties });

      // Forward content_idea blocks with a resolved brand to flownaŭ
      if (segment.category === 'content_idea' && properties.brandId) {
        try {
          // Resolve brandId → flownaŭ accountId
          const accountId = await this.flownauService.resolveAccountByBrandId(properties.brandId);

          if (accountId) {
            await this.flownauService.ingestIdeas(accountId, [
              { text: segment.text, sourceRef: block.id, aiLinked: properties.aiLinked },
            ]);
            await this.blocksService.update(block.id, {
              properties: { flownauSyncStatus: 'success' },
            });
          } else {
            this.logger.warn(`[Flownau-Integration] No flownaŭ account found for brandId ${properties.brandId}. Idea not forwarded.`);
            await this.blocksService.update(block.id, {
              properties: { flownauSyncStatus: 'no_account' },
            });
          }
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

  /**
   * Returns ultra-light brand list for a user. Used by Zazŭ to populate the brand selection keyboard.
   */
  async getUserBrands(userId: string): Promise<Array<{ id: string; brandName: string }>> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { OR: [{ id: userId }, { telegramId: userId }] },
        include: { workspaces: { take: 1 } },
      });
      const workspaceId = user?.workspaces?.[0]?.workspaceId;
      if (!workspaceId) return [];

      const brands = await this.nauthenticityService.getBrandsForWorkspace(workspaceId);
      return brands.map(b => ({ id: b.id, brandName: b.brandName }));
    } catch {
      return [];
    }
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
