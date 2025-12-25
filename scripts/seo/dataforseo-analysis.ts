#!/usr/bin/env npx tsx
/**
 * DataForSEO Analysis Script
 * Analyzes SEO opportunities by comparing our domain with competitors
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
  console.error('Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD in .env.local');
  process.exit(1);
}

const AUTH = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
const BASE_URL = 'https://api.dataforseo.com/v3';

const OUR_DOMAIN = 'tripledmap.com';
const COMPETITORS = [
  'dinersdriveinsdiveslocations.com',
  'flavortownusa.com',
];

interface ApiResponse<T> {
  status_code: number;
  status_message: string;
  tasks: Array<{
    result: T[];
    status_code: number;
    status_message: string;
  }>;
}

async function callApi<T>(endpoint: string, body: unknown, debug = false): Promise<T[]> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${AUTH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();

  if (debug) {
    console.log('\n🔍 Raw API Response:');
    console.log(JSON.stringify(data, null, 2).slice(0, 3000));
  }

  if (data.status_code !== 20000) {
    throw new Error(`API error: ${data.status_message}`);
  }

  return data.tasks?.[0]?.result || [];
}

// Get ranked keywords for a domain
async function getRankedKeywords(domain: string, limit = 100, debug = false) {
  console.log(`\n📊 Fetching ranked keywords for ${domain}...`);

  const result = await callApi('/dataforseo_labs/google/ranked_keywords/live', [
    {
      target: domain,
      language_code: 'en',
      location_code: 2840, // United States
      limit,
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
    }
  ], debug);

  return result;
}

// Get domain overview/metrics
async function getDomainMetrics(domain: string) {
  console.log(`\n📈 Fetching domain metrics for ${domain}...`);

  const result = await callApi('/dataforseo_labs/google/domain_metrics_by_categories/live', [
    {
      target: domain,
      language_code: 'en',
      location_code: 2840,
    }
  ]);

  return result;
}

// Get competitor intersection (keywords both domains rank for)
async function getKeywordIntersection(domain1: string, domain2: string, limit = 50) {
  console.log(`\n🔀 Fetching keyword intersection: ${domain1} vs ${domain2}...`);

  const result = await callApi('/dataforseo_labs/google/domain_intersection/live', [
    {
      target1: domain1,
      target2: domain2,
      language_code: 'en',
      location_code: 2840,
      limit,
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
    }
  ]);

  return result;
}

// Get keywords competitor ranks for but we don't (keyword gap)
async function getKeywordGap(ourDomain: string, competitorDomain: string, limit = 100) {
  console.log(`\n🎯 Fetching keyword gap: keywords ${competitorDomain} has that ${ourDomain} doesn't...`);

  const result = await callApi('/dataforseo_labs/google/competitors_domain/live', [
    {
      target: competitorDomain,
      language_code: 'en',
      location_code: 2840,
      limit,
      filters: [
        ['relevant_serp_items.se_type', '=', 'organic'],
      ],
    }
  ]);

  return result;
}

// Get keyword ideas based on seed keywords
async function getKeywordIdeas(seedKeywords: string[], limit = 50) {
  console.log(`\n💡 Fetching keyword ideas for: ${seedKeywords.join(', ')}...`);

  const result = await callApi('/dataforseo_labs/google/keyword_ideas/live', [
    {
      keywords: seedKeywords,
      language_code: 'en',
      location_code: 2840,
      limit,
      order_by: ['keyword_info.search_volume,desc'],
    }
  ]);

  return result;
}

// Get related keywords
async function getRelatedKeywords(seedKeyword: string, limit = 50) {
  console.log(`\n🔗 Fetching related keywords for: ${seedKeyword}...`);

  const result = await callApi('/dataforseo_labs/google/related_keywords/live', [
    {
      keyword: seedKeyword,
      language_code: 'en',
      location_code: 2840,
      limit,
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
    }
  ]);

  return result;
}

// Check account balance
async function checkBalance() {
  const response = await fetch(`${BASE_URL}/appendix/user_data`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${AUTH}`,
    },
  });

  const data = await response.json();
  return data.tasks?.[0]?.result?.[0];
}

async function main() {
  console.log('🔍 DataForSEO Analysis for Triple D Map');
  console.log('='.repeat(50));

  // Check balance first
  console.log('\n💰 Checking account balance...');
  const balance = await checkBalance();
  if (balance) {
    console.log(`   Balance: $${balance.money?.balance?.toFixed(2) || 'N/A'}`);
  }

  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'balance':
      // Already shown above
      break;

    case 'our-keywords':
      const ourKeywords = await getRankedKeywords(OUR_DOMAIN, 50, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ourResult = (ourKeywords as any[])[0];
      if (!ourResult) {
        console.log('   No data found (site may be too new)');
        break;
      }
      console.log(`\n📊 Domain Summary for ${OUR_DOMAIN}:`);
      console.log(`   Total keywords: ${ourResult.total_count}`);
      console.log(`   Positions 1-10: ${(ourResult.metrics?.organic?.pos_1 || 0) + (ourResult.metrics?.organic?.pos_2_3 || 0) + (ourResult.metrics?.organic?.pos_4_10 || 0)}`);
      console.log(`   Positions 11-20: ${ourResult.metrics?.organic?.pos_11_20 || 0}`);
      console.log(`   Estimated traffic: ${ourResult.metrics?.organic?.etv?.toFixed(1) || 0}`);
      console.log('\n📋 Top Keywords:');
      if (ourResult.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ourResult.items.slice(0, 30).forEach((item: any, i: number) => {
          const kw = item.keyword_data;
          const keyword = kw?.keyword || 'N/A';
          const vol = kw?.keyword_info?.search_volume || 0;
          const pos = item.ranked_serp_element?.serp_item?.rank_absolute || 'N/A';
          console.log(`${String(i + 1).padStart(2)}. Pos ${String(pos).padStart(3)} | Vol ${String(vol).padStart(6)} | "${keyword}"`);
        });
      }
      break;

    case 'competitor-keywords':
      const competitor = args[1] || COMPETITORS[0];
      const compKeywords = await getRankedKeywords(competitor, 100, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compResult = (compKeywords as any[])[0];
      if (!compResult) {
        console.log('   No data found');
        break;
      }
      console.log(`\n📊 Domain Summary for ${competitor}:`);
      console.log(`   Total keywords: ${compResult.total_count}`);
      console.log(`   Positions 1: ${compResult.metrics?.organic?.pos_1 || 0}`);
      console.log(`   Positions 2-3: ${compResult.metrics?.organic?.pos_2_3 || 0}`);
      console.log(`   Positions 4-10: ${compResult.metrics?.organic?.pos_4_10 || 0}`);
      console.log(`   Positions 11-20: ${compResult.metrics?.organic?.pos_11_20 || 0}`);
      console.log(`   Estimated traffic: ${compResult.metrics?.organic?.etv?.toFixed(0) || 0}`);
      console.log('\n📋 Top 50 Keywords (by search volume):');
      if (compResult.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        compResult.items.slice(0, 50).forEach((item: any, i: number) => {
          const kw = item.keyword_data;
          const keyword = kw?.keyword || 'N/A';
          const vol = kw?.keyword_info?.search_volume || 0;
          const pos = item.ranked_serp_element?.serp_item?.rank_absolute || 'N/A';
          console.log(`${String(i + 1).padStart(2)}. Pos ${String(pos).padStart(3)} | Vol ${String(vol).padStart(6)} | "${keyword}"`);
        });
      }
      break;

    case 'intersection':
      const intersectionComp = args[1] || COMPETITORS[0];
      const intersection = await getKeywordIntersection(OUR_DOMAIN, intersectionComp, 30);
      console.log(`\n📋 Keywords both ${OUR_DOMAIN} and ${intersectionComp} rank for:`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (intersection as any[]).forEach((item: any, i: number) => {
        const kw = item.keyword_data;
        console.log(`${i + 1}. "${kw.keyword}" - Vol: ${kw.keyword_info?.search_volume || 0}`);
      });
      break;

    case 'keyword-ideas':
      const seeds = args.slice(1).length > 0 ? args.slice(1) : ['diners drive-ins and dives', 'guy fieri restaurants', 'triple d'];
      const ideas = await getKeywordIdeas(seeds, 100);
      console.log('\n📋 Keyword Ideas:');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ideaResult = (ideas as any[])[0];
      if (ideaResult?.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ideaResult.items.slice(0, 50).forEach((item: any, i: number) => {
          const vol = item.keyword_info?.search_volume || 0;
          const cpc = item.keyword_info?.cpc?.toFixed(2) || 'N/A';
          const comp = item.keyword_info?.competition_level || 'N/A';
          console.log(`${String(i + 1).padStart(2)}. Vol ${String(vol).padStart(6)} | CPC $${cpc} | ${comp.padEnd(6)} | "${item.keyword}"`);
        });
      } else {
        console.log('   No ideas found');
      }
      break;

    case 'related':
      const seed = args[1] || 'diners drive-ins and dives';
      const related = await getRelatedKeywords(seed, 100);
      console.log(`\n📋 Related Keywords for "${seed}":`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const relatedResult = (related as any[])[0];
      if (relatedResult?.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        relatedResult.items.slice(0, 50).forEach((item: any, i: number) => {
          const kw = item.keyword_data;
          const vol = kw?.keyword_info?.search_volume || 0;
          console.log(`${String(i + 1).padStart(2)}. Vol ${String(vol).padStart(6)} | "${kw?.keyword}"`);
        });
      } else {
        console.log('   No related keywords found');
      }
      break;

    case 'gap':
      const gapComp = args[1] || COMPETITORS[0];
      // Get competitor's top keywords that they rank well for
      const gapKeywords = await getRankedKeywords(gapComp, 500, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gapResult = (gapKeywords as any[])[0];
      if (!gapResult?.items) {
        console.log('   No data found');
        break;
      }

      // Filter to keywords where competitor is in top 20 and has decent volume
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opportunities = gapResult.items.filter((item: any) => {
        const pos = item.ranked_serp_element?.serp_item?.rank_absolute || 999;
        const vol = item.keyword_data?.keyword_info?.search_volume || 0;
        return pos <= 20 && vol >= 100;
      });

      console.log(`\n🎯 Keyword Gap Analysis: ${gapComp}`);
      console.log(`   Total keywords in top 20 with vol >= 100: ${opportunities.length}`);
      console.log('\n📋 Top Opportunities (by volume):');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      opportunities.slice(0, 50).forEach((item: any, i: number) => {
        const kw = item.keyword_data;
        const keyword = kw?.keyword || 'N/A';
        const vol = kw?.keyword_info?.search_volume || 0;
        const pos = item.ranked_serp_element?.serp_item?.rank_absolute || 'N/A';
        console.log(`${String(i + 1).padStart(2)}. Pos ${String(pos).padStart(2)} | Vol ${String(vol).padStart(6)} | "${keyword}"`);
      });
      break;

    default:
      console.log(`
Usage: npx tsx scripts/seo/dataforseo-analysis.ts <command>

Commands:
  balance              Check account balance
  our-keywords         Show keywords we rank for
  competitor-keywords  Show competitor keywords (default: ${COMPETITORS[0]})
  intersection         Show keywords both domains rank for
  keyword-ideas        Get keyword ideas from seeds
  related <keyword>    Get related keywords
  gap                  Find competitor domains

Examples:
  npx tsx scripts/seo/dataforseo-analysis.ts our-keywords
  npx tsx scripts/seo/dataforseo-analysis.ts competitor-keywords flavortownusa.com
  npx tsx scripts/seo/dataforseo-analysis.ts keyword-ideas "guy fieri" "triple d"
  npx tsx scripts/seo/dataforseo-analysis.ts related "diners drive ins and dives near me"
`);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
