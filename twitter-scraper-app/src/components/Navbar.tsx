import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Link href="/" className="text-xl font-bold text-white">
              Twitter Scraper
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-white hover:text-blue-200 transition">
              Home
            </Link>
            <Link href="/search" className="text-white hover:text-blue-200 transition">
              Search
            </Link>
            <Link href="/hashtag" className="text-white hover:text-blue-200 transition">
              Hashtags
            </Link>
            <Link href="/user" className="text-white hover:text-blue-200 transition">
              User Tweets
            </Link>
            <Link href="/date-range" className="text-white hover:text-blue-200 transition">
              Date Range
            </Link>
            <Link href="/jobs" className="text-white hover:text-blue-200 transition">
              Jobs
            </Link>
          </div>
          
          <div className="md:hidden">
            {/* Mobile menu button - can be expanded in future */}
            <button className="p-2 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 