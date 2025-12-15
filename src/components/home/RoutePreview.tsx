'use client';

interface RoutePreviewProps {
  polylinePoints: Array<{ lat: number; lng: number }>;
  originText: string;
  destinationText: string;
}

export default function RoutePreview({ polylinePoints, originText, destinationText }: RoutePreviewProps) {
  if (!polylinePoints || polylinePoints.length === 0) {
    return null;
  }

  // Calculate bounds
  const lats = polylinePoints.map(p => p.lat);
  const lngs = polylinePoints.map(p => p.lng);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const lngMin = Math.min(...lngs);
  const lngMax = Math.max(...lngs);

  // Add padding
  const latPadding = (latMax - latMin) * 0.1 || 0.5;
  const lngPadding = (lngMax - lngMin) * 0.1 || 0.5;

  const viewLatMin = latMin - latPadding;
  const viewLatMax = latMax + latPadding;
  const viewLngMin = lngMin - lngPadding;
  const viewLngMax = lngMax + lngPadding;

  // SVG dimensions
  const width = 600;
  const height = 300;

  // Project lat/lng to SVG coordinates
  const projectX = (lng: number) =>
    ((lng - viewLngMin) / (viewLngMax - viewLngMin)) * width;
  const projectY = (lat: number) =>
    height - ((lat - viewLatMin) / (viewLatMax - viewLatMin)) * height;

  // Create path from polyline points (sample every 10th point for performance)
  const sampledPoints = polylinePoints.filter((_, i) => i % 10 === 0 || i === polylinePoints.length - 1);
  const pathData = sampledPoints
    .map((point, index) => {
      const x = projectX(point.lng);
      const y = projectY(point.lat);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Start and end coordinates
  const startPoint = polylinePoints[0];
  const endPoint = polylinePoints[polylinePoints.length - 1];
  const startX = projectX(startPoint.lng);
  const startY = projectY(startPoint.lat);
  const endX = projectX(endPoint.lng);
  const endY = projectY(endPoint.lat);

  // Center point and zoom for static map
  const centerLat = (latMin + latMax) / 2;
  const centerLng = (lngMin + lngMax) / 2;
  const latDiff = viewLatMax - viewLatMin;
  const zoom = latDiff > 10 ? 4 : latDiff > 5 ? 5 : latDiff > 2 ? 6 : 7;

  // Use Stadia Maps free tier (no API key needed for low volume)
  // Or OpenStreetMap tile server directly
  const staticMapUrl = `https://maps.geoapify.com/v1/staticmap?style=osm-bright-smooth&width=${width}&height=${height}&center=lonlat:${centerLng},${centerLat}&zoom=${zoom}&apiKey=demo`;

  return (
    <div className="route-preview-container">
      {/* Real map background */}
      <img
        src={staticMapUrl}
        alt=""
        className="route-preview-bg"
        loading="lazy"
        onError={(e) => {
          // Fallback to plain background if map fails
          e.currentTarget.style.display = 'none';
        }}
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="route-preview-map"
        preserveAspectRatio="xMidYMid meet"
      >
      {/* Fallback background in case image fails */}
      <rect width={width} height={height} fill="#f8f5f0" />

      {/* Route path with shadow for visibility */}
      <path
        d={pathData}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={pathData}
        stroke="#E63946"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Start marker (green) */}
      <circle
        cx={startX}
        cy={startY}
        r="10"
        fill="#10b981"
        stroke="white"
        strokeWidth="3"
      />

      {/* End marker (red) */}
      <circle
        cx={endX}
        cy={endY}
        r="10"
        fill="#E63946"
        stroke="white"
        strokeWidth="3"
      />

      {/* Labels */}
      <text
        x={startX}
        y={startY - 20}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#10b981"
        fontFamily="var(--font-display)"
        stroke="white"
        strokeWidth="4"
        paintOrder="stroke"
      >
        {originText.split(',')[0]}
      </text>

      <text
        x={endX}
        y={endY + 30}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#E63946"
        fontFamily="var(--font-display)"
        stroke="white"
        strokeWidth="4"
        paintOrder="stroke"
      >
        {destinationText.split(',')[0]}
      </text>
    </svg>
    </div>
  );
}
