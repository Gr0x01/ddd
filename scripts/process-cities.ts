/**
 * Process SimpleMaps data into lightweight city lookup for road trip planner
 * Filters to ranking 1-2 cities (major cities people actually road trip to)
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';

interface SimpleMapsCity {
  city: string;
  city_ascii: string;
  state_id: string;
  state_name: string;
  lat: string;
  lng: string;
  population: string;
  ranking: string;
}

// Zod schema for city validation
const CitySchema = z.object({
  city: z.string().min(1, 'City name cannot be empty'),
  state: z.string().length(2, 'State must be 2-letter code'),
  population: z.number().int().nonnegative('Population must be non-negative')
});

type CityLookupEntry = z.infer<typeof CitySchema>;

async function processCities() {
  console.log('📊 Processing SimpleMaps US Cities data...\n');

  // Read CSV
  const csvPath = path.join(process.cwd(), 'tmp/simplemaps_uscities_basicv1.92/uscities.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  }) as SimpleMapsCity[];

  console.log(`Total cities in CSV: ${records.length.toLocaleString()}`);

  // Filter to ranking 1-2 (major cities for road trips)
  const majorCities = records.filter(city => {
    const ranking = parseInt(city.ranking);
    return ranking === 1 || ranking === 2;
  });

  console.log(`Filtered to rank 1-2: ${majorCities.length.toLocaleString()} cities\n`);

  // Create lightweight lookup with validation
  const cityLookup: CityLookupEntry[] = [];
  let skippedCount = 0;

  for (const city of majorCities) {
    try {
      const entry = CitySchema.parse({
        city: city.city_ascii, // Use ASCII version for matching
        state: city.state_id,
        population: parseInt(city.population)
      });
      cityLookup.push(entry);
    } catch (error) {
      skippedCount++;
      console.warn(`⚠️  Skipped invalid city: ${city.city} (${error instanceof Error ? error.message : 'validation failed'})`);
    }
  }

  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} invalid cities\n`);
  }

  // Sort by population (largest first) for better autocomplete UX
  cityLookup.sort((a, b) => b.population - a.population);

  // Show top 20
  console.log('Top 20 cities by population:');
  cityLookup.slice(0, 20).forEach((city, i) => {
    console.log(`${i + 1}. ${city.city}, ${city.state} (${city.population.toLocaleString()})`);
  });

  // Calculate bundle size estimate
  const jsonString = JSON.stringify(cityLookup);
  const sizeKb = (jsonString.length / 1024).toFixed(2);
  console.log(`\n📦 JSON size: ${sizeKb} KB (uncompressed)`);
  console.log(`   Estimated gzipped: ~${(parseFloat(sizeKb) * 0.3).toFixed(2)} KB`);

  // Write to public directory
  const outputPath = path.join(process.cwd(), 'public/data/us-cities.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(cityLookup, null, 2));

  console.log(`\n✅ Wrote ${cityLookup.length} cities to: public/data/us-cities.json`);

  // Also create minified version
  const minifiedPath = path.join(process.cwd(), 'public/data/us-cities.min.json');
  fs.writeFileSync(minifiedPath, JSON.stringify(cityLookup));
  const minSizeKb = (fs.statSync(minifiedPath).size / 1024).toFixed(2);
  console.log(`✅ Wrote minified version: ${minSizeKb} KB`);
}

processCities().catch(console.error);
