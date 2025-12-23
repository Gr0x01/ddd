import { NextRequest, NextResponse } from 'next/server';

const INDEXNOW_KEY = '43053a5397ebc6ccb4db06f5d45d665c';
const HOST = 'www.tripledmap.com';

/**
 * IndexNow API route for submitting URLs to search engines
 * POST /api/indexnow with { urls: string[] } body
 *
 * Supported search engines: Bing, Yandex, Naver, Seznam, Yep
 * Note: Google does not support IndexNow
 */
export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'urls array is required' },
        { status: 400 }
      );
    }

    // Limit to 10,000 URLs per request (IndexNow limit)
    const urlsToSubmit = urls.slice(0, 10000);

    const response = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urlsToSubmit,
      }),
    });

    if (response.ok || response.status === 202) {
      return NextResponse.json({
        success: true,
        submitted: urlsToSubmit.length,
        message: 'URLs submitted to IndexNow',
      });
    }

    const errorText = await response.text();
    return NextResponse.json(
      { error: `IndexNow API error: ${response.status}`, details: errorText },
      { status: response.status }
    );
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit to IndexNow' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to manually trigger sitemap submission
 * Useful for initial indexing or after major updates
 */
export async function GET() {
  const baseUrl = `https://${HOST}`;

  try {
    // Fetch the sitemap to get all URLs
    const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
    if (!sitemapResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch sitemap' },
        { status: 500 }
      );
    }

    const sitemapText = await sitemapResponse.text();

    // Extract URLs from sitemap XML
    const urlMatches = sitemapText.match(/<loc>([^<]+)<\/loc>/g) || [];
    const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'No URLs found in sitemap' },
        { status: 400 }
      );
    }

    // Submit to IndexNow
    const response = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
    });

    if (response.ok || response.status === 202) {
      return NextResponse.json({
        success: true,
        submitted: Math.min(urls.length, 10000),
        total: urls.length,
        message: 'Sitemap URLs submitted to IndexNow',
      });
    }

    const errorText = await response.text();
    return NextResponse.json(
      { error: `IndexNow API error: ${response.status}`, details: errorText },
      { status: response.status }
    );
  } catch (error) {
    console.error('IndexNow sitemap submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit sitemap to IndexNow' },
      { status: 500 }
    );
  }
}
