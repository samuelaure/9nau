import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { BlocksService } from '../blocks/blocks.service';
import dayjs from 'dayjs';
import axios from 'axios';

const JournalSummarySchema = z.object({
  synthesis: z.string().describe('A high-level interpretation of "what it means" (main themes, mood, focus trajectory, patterns). Priorities in position.'),
  summary: z.string().describe('An objective, beautifully written recount of "what happened" (facts, completed tasks, metrics).'),
  highlights: z.array(z.string()).describe('List of key themes or highlights.'),
});

type JournalSummaryOutput = z.infer<typeof JournalSummarySchema>;

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly blocksService: BlocksService,
  ) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not found. Journal summaries AI generation is disabled.');
    }
  }

  /**
   * Mock for user preferences. In Phase 9 this will be a real DB model.
   */
  private async getUserPreferences() {
    return {
      autoDaily: true,
      autoWeekly: true,
      autoMonthly: true,
      autoTrimester: true,
      autoYearly: true,
      defaultLanguage: 'es',
    };
  }

  async generateSummary(
    periodType: 'daily' | 'weekly' | 'monthly' | 'trimester' | 'yearly' | 'custom',
    startDateStr: string,
    endDateStr: string,
    tzOffset: number = 0
  ) {
    const startDate = dayjs(startDateStr).startOf('day').toDate();
    const endDate = dayjs(endDateStr).endOf('day').toDate();

    this.logger.log(`Generating hierarchical ${periodType} summary from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Idempotency check: don't regenerate if already exists for the exact period
    const existingSummary = await this.prisma.block.findFirst({
      where: {
        type: 'journal_summary',
        properties: {
          path: ['periodType'],
          equals: periodType
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    if (existingSummary && periodType !== 'custom') {
      this.logger.log(`Summary for ${periodType} already exists (ID: ${existingSummary.id}). Skipping.`);
      return { success: true, blockId: existingSummary.id, cached: true };
    }

    // 1. Fetch RAW data (journal_entries, actions, etc.)
    const rawBlocksInPeriod = await this.prisma.block.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null
      }
    });

    const journalEntries = rawBlocksInPeriod.filter(b => b.type === 'journal_entry');
    const actionBlocks = rawBlocksInPeriod.filter(b => b.type === 'action');
    const contentIdeas = rawBlocksInPeriod.filter(b => b.type === 'content_idea');
    const completedBlocks = rawBlocksInPeriod.filter(
      b => b.type === 'action' && ((b.properties as any)?.status === 'done' || (b.properties as any)?.status === 'completed')
    );

    // 2. Recursive/Hierarchical context: fetch existing INFERIOR summaries
    // We fetch summaries that are strictly "smaller" than the current periodType
    const inferiorSummaries = await this.prisma.block.findMany({
      where: {
        type: 'journal_summary',
        createdAt: { gte: startDate, lte: endDate },
        // Simple logic: we include all existing summaries in the period
        // (The AI prompt will be instructed on how to treat them as condensed knowledge)
      }
    });

    // 3. Format context for AI
    let contextText = '';

    if (inferiorSummaries.length > 0) {
      contextText += "### INFERIOR PERIOD SUMMARIES (Condensed Knowledge):\n";
      inferiorSummaries.forEach(sum => {
        const props = sum.properties as any;
        contextText += `#### ${props.periodType} Summary (${dayjs(sum.createdAt).format('YYYY-MM-DD')}):\n`;
        contextText += `**Synthesis**: ${props.synthesis || ''}\n`;
        contextText += `**Summary**: ${props.summary || ''}\n\n`;
      });
    }

    contextText += "### RAW DATA (Individual Experiences):\n";
    if (journalEntries.length > 0) {
      contextText += "#### Journal Entries:\n";
      journalEntries.forEach(entry => {
        const text = (entry.properties as any)?.summary || (entry.properties as any)?.text || '';
        if (text) contextText += `- [${dayjs(entry.createdAt).format('HH:mm')}] ${text}\n`;
      });
    }

    if (actionBlocks.length > 0) {
      contextText += "\n#### Actions (Created/Status):\n";
      actionBlocks.forEach(action => {
        const text = (action.properties as any)?.text || (action.properties as any)?.name || 'Untitled';
        const st = (action.properties as any)?.status;
        contextText += `- [${st || 'pending'}] ${text}\n`;
      });
    }

    if (!contextText.trim()) {
      return { success: false, error: 'No data to summarize in this period.' };
    }

    // 4. Call OpenAI with Synthesis + Summary requirement
    let aiResult: JournalSummaryOutput = { 
      synthesis: 'Resumen no disponible.', 
      summary: 'No se encontraron datos procesables.', 
      highlights: [] 
    };

    if (this.openai) {
      try {
        const completion = await (this.openai.beta as any).chat.completions.parse({
          model: 'gpt-4o',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: `You are an AI Second Brain architect creating a ${periodType} review. 
Your output MUST contain two distinct parts:
1. **Synthesis**: The "Soul" of the period. A deep, high-level interpretation of what these experiences mean, mood trajectory, recurring patterns, and overall impact. Prioritize this in position.
2. **Summary**: The "Body". An objective, structured recount of what actually happened, tasks completed, metrics, and facts.

RECURSIVE LOGIC:
You are provided with both "Inferior Summaries" (condensed knowledge from smaller periods) and "Raw Data" (individual events). 
Use the Inferior Summaries as your primary cognitive anchor to avoid getting lost in noise, while using Raw Data to extract specific flavor and evidence.

TONE: Reflective, elite, concise yet profound. 
LANGUAGE: Spanish (predominantly). 
LENGTH: ${periodType === 'daily' ? 'Brief (1-2 paragraphs)' : periodType === 'yearly' ? 'Comprehensive (4-5 paragraphs)' : 'Balanced (2-3 paragraphs)'}.`
            },
            {
              role: 'user',
              content: contextText
            }
          ],
          response_format: zodResponseFormat(JournalSummarySchema, 'JournalSummary'),
        });

        const parsed = completion.choices[0].message.parsed;
        if (parsed) {
          aiResult = parsed as JournalSummaryOutput;
        }
      } catch (err) {
        this.logger.error('Error calling openai for hierarchical summary', err);
      }
    }

    // 5. Save as Block
    const newSummaryBlock = await this.blocksService.create({
      type: 'journal_summary',
      properties: {
        periodType,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        synthesis: aiResult.synthesis,
        summary: aiResult.summary,
        highlights: aiResult.highlights,
        actionCount: actionBlocks.length,
        completedCount: completedBlocks.length,
        contentIdeasCount: contentIdeas.length
      }
    });

    // 6. Build Relations (Hierarchical Graph)
    // Link to inferior summaries
    for (const inf of inferiorSummaries) {
      await this.prisma.relation.create({
        data: {
          type: 'parent_summary_of',
          fromBlockId: newSummaryBlock.id,
          toBlockId: inf.id
        }
      });
    }
    // Link to raw entries
    for (const j of journalEntries) {
      await this.prisma.relation.create({
        data: {
          type: 'summarized_by',
          fromBlockId: j.id,
          toBlockId: newSummaryBlock.id
        }
      });
    }

    // 7. Format Delivery Message
    let finalDeliveryText = `✨ *SÍNTESIS*\n${aiResult.synthesis}\n\n`;
    finalDeliveryText += `📝 *RESUMEN*\n${aiResult.summary}\n\n`;
    
    const statsLine = `📊 Stats: ✅ ${completedBlocks.length}/${actionBlocks.length} | 💡 ${contentIdeas.length} | 📓 ${journalEntries.length}\n`;
    finalDeliveryText += statsLine;

    // Daily specific: chronological list
    if (periodType === 'daily' && journalEntries.length > 0) {
      finalDeliveryText += `\n📅 *ENTRADAS CRONOLÓGICAS:*\n`;
      journalEntries.forEach(e => {
        const text = (e.properties as any)?.summary || (e.properties as any)?.text || '';
        finalDeliveryText += `• _${dayjs(e.createdAt).format('HH:mm')}_: ${text}\n`;
      });
    }

    // 8. Notify Zazu (if configured)
    const zazuUrl = process.env.ZAZU_INTERNAL_URL || 'http://zazu:3000';
    const nauKey = process.env.NAU_SERVICE_KEY;

    const periodTitle = `${periodType === 'daily' ? 'Diario' : periodType === 'weekly' ? 'Semanal' : periodType === 'monthly' ? 'Mensual' : periodType === 'trimester' ? 'Trimestral' : periodType === 'yearly' ? 'Anual' : 'Personalizado'}`;
    const displayDate = dayjs(startDate).format('DD MMM YYYY');

    if (periodType !== 'custom' && nauKey) {
      try {
        await axios.post(`${zazuUrl}/api/internal/notify`, {
           userId: '1', // Default MVP user
           type: 'journal_summary',
           periodType,
           periodTitle: `Resumen ${periodTitle} — ${displayDate}`,
           summaryData: finalDeliveryText
        }, {
           headers: { Authorization: `Bearer ${nauKey}` },
           timeout: 10000
        });
      } catch (err: any) {
        this.logger.error(`Failed to notify Zazŭ for hierarchical summary: ${err.message}`);
      }
    }

    return {
      success: true,
      blockId: newSummaryBlock.id,
      data: newSummaryBlock,
      summaryData: finalDeliveryText
    };
  }

  async saveDirectSummary(
    periodType: string,
    type: string,
    synthesis: string,
    summary: string,
    startDateStr: string,
    endDateStr: string
  ) {
    const startDate = dayjs(startDateStr).startOf('day').toDate();
    const endDate = dayjs(endDateStr).endOf('day').toDate();

    this.logger.log(`Saving direct summary of type ${type} for period ${periodType}`);

    const newSummaryBlock = await this.blocksService.create({
      type, // 'journal_summary' or 'content_brief'
      properties: {
        periodType,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        synthesis,
        summary,
        highlights: [],
      }
    });

    return {
      success: true,
      blockId: newSummaryBlock.id,
      data: newSummaryBlock,
    };
  }

  // --- REFACTORED TRIGGERS ---

  @Cron('0 23 * * *')
  async handleDailySummary() {
    const prefs = await this.getUserPreferences();
    if (!prefs.autoDaily) return;
    
    this.logger.log('Daily Summary Triggered (Config-aware)');
    await this.generateSummary('daily', dayjs().startOf('day').toISOString(), dayjs().endOf('day').toISOString());
  }

  @Cron('0 20 * * 0')
  async handleWeeklySummary() {
    const prefs = await this.getUserPreferences();
    if (!prefs.autoWeekly) return;

    this.logger.log('Weekly Summary Triggered (Config-aware)');
    const start = dayjs().startOf('week').add(1, 'day').toISOString();
    const end = dayjs().endOf('week').add(1, 'day').toISOString();
    await this.generateSummary('weekly', start, end);
  }

  @Cron('0 18 1 * *')
  async handleMonthlySummary() {
    const prefs = await this.getUserPreferences();
    if (!prefs.autoMonthly) return;

    this.logger.log('Monthly Summary Triggered (Config-aware)');
    const start = dayjs().subtract(1, 'month').startOf('month').toISOString();
    const end = dayjs().subtract(1, 'month').endOf('month').toISOString();
    await this.generateSummary('monthly', start, end);
  }

  @Cron('0 18 1 1,4,7,10 *')
  async handleTrimesterSummary() {
    const prefs = await this.getUserPreferences();
    if (!prefs.autoTrimester) return;

    const start = dayjs().subtract(3, 'months').startOf('month').toISOString();
    const end = dayjs().subtract(1, 'month').endOf('month').toISOString();
    await this.generateSummary('trimester', start, end);
  }

  @Cron('0 18 1 1 *')
  async handleYearlySummary() {
    const prefs = await this.getUserPreferences();
    if (!prefs.autoYearly) return;

    const start = dayjs().subtract(1, 'year').startOf('year').toISOString();
    const end = dayjs().subtract(1, 'year').endOf('year').toISOString();
    await this.generateSummary('yearly', start, end);
  }
}
