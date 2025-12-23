#!/usr/bin/env tsx
/**
 * Categorize dishes using LLM
 *
 * Usage:
 *   npx tsx scripts/ingestion/categorize-dishes.ts --limit 50
 *   npx tsx scripts/ingestion/categorize-dishes.ts --dry-run
 *   npx tsx scripts/ingestion/categorize-dishes.ts --all
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Categories for dish classification
const CATEGORIES = [
  'BBQ',
  'Seafood',
  'Burgers',
  'Mexican',
  'Italian',
  'Asian',
  'Breakfast',
  'Comfort Food',
  'Sandwiches',
  'Pizza',
  'Steaks',
  'Southern',
  'Cajun',
  'Desserts',
  'Other'
] as const;

interface DishRow {
  id: string;
  name: string;
  description: string | null;
  slug: string;
}

interface CategorizedDish {
  id: string;
  category: string;
}

// Token tracking
let totalPromptTokens = 0;
let totalCompletionTokens = 0;

async function categorizeBatch(dishes: DishRow[]): Promise<CategorizedDish[]> {
  const dishList = dishes
    .map((d, i) => `${i + 1}. "${d.name}"${d.description ? ` - ${d.description}` : ''}`)
    .join('\n');

  const prompt = `Categorize each dish into exactly ONE of these categories:
${CATEGORIES.join(', ')}

Guidelines:
- BBQ: Smoked meats, ribs, brisket, pulled pork
- Seafood: Fish, shrimp, crab, lobster, oysters
- Burgers: Hamburgers and burger-style sandwiches
- Mexican: Tacos, burritos, enchiladas, Mexican-inspired dishes
- Italian: Pasta, pizza-adjacent dishes, Italian meats/cheeses
- Asian: Chinese, Japanese, Thai, Vietnamese, Korean, etc.
- Breakfast: Eggs, pancakes, waffles, breakfast burritos
- Comfort Food: Mac and cheese, meatloaf, pot roast, casseroles
- Sandwiches: Subs, hoagies, non-burger sandwiches
- Pizza: Pizza and calzones
- Steaks: Beef steaks, prime rib, steak sandwiches
- Southern: Fried chicken, soul food, country cooking
- Cajun: Louisiana cuisine, gumbo, jambalaya, crawfish
- Desserts: Sweet dishes, pies, cakes, ice cream
- Other: Anything that doesn't fit well in other categories

Dishes to categorize:
${dishList}

Return ONLY a JSON array with objects having "index" (1-based) and "category" (exact category name from list above):
[{"index": 1, "category": "BBQ"}, {"index": 2, "category": "Seafood"}, ...]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  // Track tokens
  if (response.usage) {
    totalPromptTokens += response.usage.prompt_tokens;
    totalCompletionTokens += response.usage.completion_tokens;
  }

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from LLM');

  try {
    const parsed = JSON.parse(content);
    // Handle both array and object with array property
    const results: Array<{ index: number; category: string }> = Array.isArray(parsed)
      ? parsed
      : parsed.dishes || parsed.results || parsed.categories || [];

    return results.map((r) => ({
      id: dishes[r.index - 1]?.id || '',
      category: CATEGORIES.includes(r.category as any) ? r.category : 'Other',
    })).filter(r => r.id);
  } catch (e) {
    console.error('Failed to parse LLM response:', content);
    throw e;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1], 10)
    : 100;
  const dryRun = args.includes('--dry-run');
  const forceAll = args.includes('--all');
  const batchSize = 50; // Dishes per LLM call (increased for tier 5)
  const parallelBatches = 5; // Run 5 API calls in parallel (tier 5 allows high concurrency)

  console.log('\n🍽️  DDD Dish Categorization');
  console.log('━'.repeat(50));
  console.log(`Model: gpt-4o-mini`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${limit} dishes`);
  console.log(`Batch size: ${batchSize} dishes per API call`);
  console.log(`Parallel batches: ${parallelBatches}`);
  console.log('');

  // Fetch dishes that need categorization
  let query = supabase
    .from('dishes')
    .select('id, name, description, slug')
    .limit(limit);

  if (!forceAll) {
    query = query.is('category', null);
  }

  const { data: dishes, error } = await query;

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  if (!dishes || dishes.length === 0) {
    console.log('✅ No dishes need categorization!');
    process.exit(0);
  }

  console.log(`Found ${dishes.length} dish(es) to categorize\n`);

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  // Split dishes into batches
  const allBatches: DishRow[][] = [];
  for (let i = 0; i < dishes.length; i += batchSize) {
    allBatches.push(dishes.slice(i, i + batchSize));
  }

  // Process batches in parallel groups
  for (let i = 0; i < allBatches.length; i += parallelBatches) {
    const parallelGroup = allBatches.slice(i, i + parallelBatches);
    const groupStartIdx = i + 1;
    const groupEndIdx = Math.min(i + parallelBatches, allBatches.length);

    console.log(`[Batches ${groupStartIdx}-${groupEndIdx}/${allBatches.length}] Processing ${parallelGroup.length} batches in parallel...`);

    if (dryRun) {
      console.log('  🔍 DRY RUN - Sample dishes from first batch:');
      parallelGroup[0].slice(0, 3).forEach(d => console.log(`     - ${d.name}`));
      continue;
    }

    // Run batches in parallel
    const results = await Promise.allSettled(
      parallelGroup.map(async (batch, batchIdx) => {
        try {
          const categorized = await categorizeBatch(batch);

          // Update database (can do in parallel too for speed)
          const updatePromises = categorized.map(async (dish) => {
            const { error: updateError } = await supabase
              .from('dishes')
              .update({ category: dish.category })
              .eq('id', dish.id);
            return { dish, error: updateError };
          });

          const updateResults = await Promise.all(updatePromises);
          return { batchIdx, categorized, updateResults, batch };
        } catch (err) {
          return { batchIdx, error: err, batch };
        }
      })
    );

    // Process results
    for (const result of results) {
      if (result.status === 'fulfilled' && !('error' in result.value)) {
        const { categorized, updateResults, batch } = result.value;
        let batchSuccess = 0;
        let batchFail = 0;

        for (const ur of updateResults) {
          if (ur.error) {
            batchFail++;
          } else {
            batchSuccess++;
          }
        }

        successCount += batchSuccess;
        failCount += batchFail;

        // Show sample results
        const samples = categorized.slice(0, 2);
        samples.forEach(s => {
          const dishName = batch.find(b => b.id === s.id)?.name || 'Unknown';
          console.log(`  ✅ "${dishName}" → ${s.category}`);
        });
      } else {
        const value = result.status === 'fulfilled' ? result.value : result.reason;
        const batch = value?.batch || [];
        console.log(`  ❌ Batch error: ${value?.error?.message || value?.message || 'Unknown error'}`);
        failCount += batch.length;
      }
    }

    // Brief delay between parallel groups
    if (i + parallelBatches < allBatches.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalTokens = totalPromptTokens + totalCompletionTokens;
  // gpt-4o-mini pricing: $0.15/1M input, $0.60/1M output
  const cost = (totalPromptTokens * 0.00000015) + (totalCompletionTokens * 0.0000006);

  console.log('\n' + '━'.repeat(50));
  console.log('📊 Summary');
  console.log('━'.repeat(50));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏱️  Time: ${elapsed}s`);
  console.log(`🪙 Tokens: ${totalTokens.toLocaleString()} (${totalPromptTokens.toLocaleString()} in / ${totalCompletionTokens.toLocaleString()} out)`);
  console.log(`💰 Cost: $${cost.toFixed(4)}`);
  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
