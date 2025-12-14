'use client';

interface SearchFormProps {
  origin: string;
  destination: string;
  radiusMiles: number;
  isLoading: boolean;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onSubmit: () => void;
}

const EXAMPLE_ROUTES = [
  { origin: 'San Francisco, CA', destination: 'Los Angeles, CA', label: 'SF to LA' },
  { origin: 'New York, NY', destination: 'Boston, MA', label: 'NYC to Boston' },
  { origin: 'Chicago, IL', destination: 'Milwaukee, WI', label: 'Chicago to Milwaukee' },
];

export default function SearchForm({
  origin,
  destination,
  radiusMiles,
  isLoading,
  onOriginChange,
  onDestinationChange,
  onRadiusChange,
  onSubmit
}: SearchFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const swapLocations = () => {
    const temp = origin;
    onOriginChange(destination);
    onDestinationChange(temp);
  };

  const loadExample = (exampleOrigin: string, exampleDestination: string) => {
    onOriginChange(exampleOrigin);
    onDestinationChange(exampleDestination);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      {/* Example Routes */}
      {!origin && !destination && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Try an example route:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_ROUTES.map((route) => (
              <button
                key={route.label}
                type="button"
                onClick={() => loadExample(route.origin, route.destination)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                {route.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origin */}
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            placeholder="San Francisco, CA"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>

        {/* Destination */}
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="destination"
              name="destination"
              value={destination}
              onChange={(e) => onDestinationChange(e.target.value)}
              placeholder="Los Angeles, CA"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={swapLocations}
              disabled={!origin || !destination}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Swap locations"
            >
              ⇄
            </button>
          </div>
        </div>
      </div>

      {/* Search Radius */}
      <div className="mt-4">
        <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
          Search radius: {radiusMiles} miles
        </label>
        <input
          type="range"
          id="radius"
          min="5"
          max="25"
          step="5"
          value={radiusMiles}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5 mi</span>
          <span>25 mi</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isLoading || !origin || !destination}
          className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Planning Route...' : 'Plan My Route'}
        </button>
      </div>
    </form>
  );
}
