export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <h1 className="font-display text-6xl font-bold text-primary">
          DDD Restaurant Map
        </h1>
        <p className="font-ui text-xl text-secondary">
          Find restaurants featured on Guy Fieri's Diners, Drive-ins and Dives
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <div className="bg-secondary p-6 rounded-lg shadow-md">
            <p className="font-mono text-4xl font-bold text-accent-primary">0</p>
            <p className="font-mono text-sm text-muted mt-2">Restaurants</p>
          </div>
          <div className="bg-secondary p-6 rounded-lg shadow-md">
            <p className="font-mono text-4xl font-bold text-accent-primary">0</p>
            <p className="font-mono text-sm text-muted mt-2">Episodes</p>
          </div>
          <div className="bg-secondary p-6 rounded-lg shadow-md">
            <p className="font-mono text-4xl font-bold text-accent-primary">0</p>
            <p className="font-mono text-sm text-muted mt-2">Cities</p>
          </div>
        </div>
        <p className="font-mono text-sm text-muted mt-8">
          Project initialized - Ready to build!
        </p>
      </div>
    </main>
  );
}
