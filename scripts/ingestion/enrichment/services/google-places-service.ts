import { withRetry } from '../shared/retry-handler';

const GOOGLE_PLACES_API_BASE = 'https://places.googleapis.com/v1';

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating?: number;
  userRatingsTotal?: number;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating?: number;
  userRatingsTotal?: number;
  websiteUri?: string;
  photos?: PlacePhoto[];
  businessStatus?: string;
  latitude?: number;
  longitude?: number;
}

export interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

export interface GooglePlacesConfig {
  apiKey: string;
}

const SKU_COSTS = {
  textSearchBasic: 0.032,
  placeDetailsBasic: 0.017,
  placePhoto: 0.007,
};

export function createGooglePlacesService(config: GooglePlacesConfig) {
  const { apiKey } = config;

  let totalCost = 0;

  async function textSearch(query: string, maxResults: number = 3): Promise<PlaceSearchResult[]> {
    const requestBody = {
      textQuery: query,
      maxResultCount: maxResults,
    };

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.rating',
      'places.userRatingCount',
    ].join(',');

    const response = await withRetry(
      async () => {
        const res = await fetch(`${GOOGLE_PLACES_API_BASE}/places:searchText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': fieldMask,
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Google Places API error ${res.status}: ${errorText}`);
        }

        return res.json();
      },
      'Google Places Text Search'
    );

    totalCost += SKU_COSTS.textSearchBasic;

    const places = response.places || [];
    return places.map((place: any) => ({
      placeId: place.id as string,
      name: place.displayName?.text || '',
      formattedAddress: place.formattedAddress as string,
      rating: place.rating as number | undefined,
      userRatingsTotal: place.userRatingCount as number | undefined,
    }));
  }

  async function findPlaceId(
    restaurantName: string,
    city: string,
    state?: string
  ): Promise<{ placeId: string | null; confidence: number; matchedName?: string }> {
    const query = `${restaurantName} ${city}${state ? ` ${state}` : ''}`;

    const results = await textSearch(query, 3);

    if (results.length === 0) {
      return { placeId: null, confidence: 0 };
    }

    const normalizedTarget = normalizeForComparison(restaurantName);

    for (const result of results) {
      const normalizedResult = normalizeForComparison(result.name);
      const similarity = calculateSimilarity(normalizedTarget, normalizedResult);

      if (similarity >= 0.8) {
        return {
          placeId: result.placeId,
          confidence: similarity,
          matchedName: result.name,
        };
      }
    }

    const bestMatch = results[0];
    const bestSimilarity = calculateSimilarity(
      normalizedTarget,
      normalizeForComparison(bestMatch.name)
    );

    return {
      placeId: bestMatch.placeId,
      confidence: bestSimilarity,
      matchedName: bestMatch.name,
    };
  }

  async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    const fields = [
      'id',
      'displayName',
      'formattedAddress',
      'rating',
      'userRatingCount',
      'websiteUri',
      'businessStatus',
      'photos',
      'location', // lat/lng coordinates
    ];

    const fieldMask = fields.join(',');

    const response = await withRetry(
      async () => {
        const res = await fetch(`${GOOGLE_PLACES_API_BASE}/places/${placeId}`, {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': fieldMask,
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          const errorText = await res.text();
          throw new Error(`Google Places API error ${res.status}: ${errorText}`);
        }

        return res.json();
      },
      'Google Places Details'
    );

    if (!response) return null;

    totalCost += SKU_COSTS.placeDetailsBasic;

    const photos = (response.photos || []).map((photo: any) => ({
      name: photo.name as string,
      widthPx: photo.widthPx as number,
      heightPx: photo.heightPx as number,
    }));

    return {
      placeId: response.id,
      name: response.displayName?.text || '',
      formattedAddress: response.formattedAddress,
      rating: response.rating,
      userRatingsTotal: response.userRatingsTotal,
      websiteUri: response.websiteUri,
      businessStatus: response.businessStatus,
      photos,
      latitude: response.location?.latitude,
      longitude: response.location?.longitude,
    };
  }

  async function getPhotoBuffer(photoName: string, maxWidth: number = 800): Promise<Buffer | null> {
    const url = `${GOOGLE_PLACES_API_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;

    try {
      const buffer = await withRetry(
        async () => {
          const res = await fetch(url, { method: 'GET' });

          if (!res.ok) {
            throw new Error(`Photo fetch failed: ${res.status}`);
          }

          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        },
        'Google Places Photo Download'
      );

      totalCost += SKU_COSTS.placePhoto;

      return buffer;
    } catch (error) {
      console.log(`      ⚠️  Photo download failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  function getTotalCost(): number {
    return totalCost;
  }

  function resetCost(): void {
    totalCost = 0;
  }

  return {
    findPlaceId,
    getPlaceDetails,
    getPhotoBuffer,
    getTotalCost,
    resetCost,
  };
}

function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  if (a.includes(b) || b.includes(a)) {
    return 0.9;
  }

  const aWords = new Set(a.split(' '));
  const bWords = new Set(b.split(' '));
  const intersection = [...aWords].filter((w) => bWords.has(w));
  const union = new Set([...aWords, ...bWords]);

  return intersection.length / union.size;
}

export type GooglePlacesService = ReturnType<typeof createGooglePlacesService>;
