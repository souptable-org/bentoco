import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-muted-foreground text-lg mb-8">
        The page you are looking for does not exist.
      </p>
      <Link 
        href="/"
        className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-bold tracking-wider uppercase text-sm hover:bg-primary/90 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
