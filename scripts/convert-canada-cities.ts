/**
 * Convert SimpleMaps Canada cities CSV to JSON format
 * Filters to cities with population > 5,000
 * Output format matches US cities: { city, state, population }
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface CanadaCity {
  city: string;
  city_ascii: string;
  province_id: string;
  province_name: string;
  lat: string;
  lng: string;
  population: string;
  density: string;
  timezone: string;
  ranking: string;
  postal: string;
  id: string;
}

interface OutputCity {
  city: string;
  state: string;
  population: number;
}

const POPULATION_THRESHOLD = 5000;

function parseCSV(content: string): CanadaCity[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const cities: CanadaCity[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV with quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const city: Record<string, string> = {};
    headers.forEach((header, index) => {
      city[header] = values[index] || '';
    });

    cities.push(city as unknown as CanadaCity);
  }

  return cities;
}

function main() {
  const csvPath = join(process.cwd(), 'tmp', 'canadacities.csv');
  const outputPath = join(process.cwd(), 'public', 'data', 'ca-cities.min.json');

  console.log('Reading CSV from:', csvPath);
  const csvContent = readFileSync(csvPath, 'utf-8');

  const canadaCities = parseCSV(csvContent);
  console.log(`Parsed ${canadaCities.length} cities from CSV`);

  // Filter and transform
  const outputCities: OutputCity[] = canadaCities
    .filter(city => {
      const pop = parseInt(city.population, 10);
      return !isNaN(pop) && pop >= POPULATION_THRESHOLD;
    })
    .map(city => ({
      city: city.city_ascii || city.city,
      state: city.province_id,
      population: parseInt(city.population, 10)
    }))
    .sort((a, b) => b.population - a.population);

  console.log(`Filtered to ${outputCities.length} cities with population >= ${POPULATION_THRESHOLD}`);

  // Write minified JSON
  writeFileSync(outputPath, JSON.stringify(outputCities));
  console.log('Written to:', outputPath);

  // Show sample
  console.log('\nTop 10 cities:');
  outputCities.slice(0, 10).forEach(city => {
    console.log(`  ${city.city}, ${city.state} - ${city.population.toLocaleString()}`);
  });
}

main();
