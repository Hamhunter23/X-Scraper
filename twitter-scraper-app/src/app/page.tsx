import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Twitter Scraper Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search Tweets Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h2 className="text-xl font-semibold">Search Tweets</h2>
          </div>
          <div className="p-6">
            <p className="text-black mb-4">
              Search for tweets by keyword or phrase. Filter by latest, top, or media tweets.
            </p>
            <Link href="/search" className="block text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Get Started
            </Link>
          </div>
        </div>

        {/* Hashtag Tweets Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 text-white p-4">
            <h2 className="text-xl font-semibold">Hashtag Tweets</h2>
          </div>
          <div className="p-6">
            <p className="text-black mb-4">
              Search for tweets by hashtag. Find trending topics and conversations.
            </p>
            <Link href="/hashtag" className="block text-center py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition">
              Get Started
            </Link>
          </div>
        </div>

        {/* User Tweets Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-purple-600 text-white p-4">
            <h2 className="text-xl font-semibold">User Tweets</h2>
          </div>
          <div className="p-6">
            <p className="text-black mb-4">
              Retrieve tweets from specific users. Get tweets, replies, media, or likes.
            </p>
            <Link href="/user" className="block text-center py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
              Get Started
            </Link>
          </div>
        </div>

        {/* Date Range Tweets Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-orange-600 text-white p-4">
            <h2 className="text-xl font-semibold">Date Range Tweets</h2>
          </div>
          <div className="p-6">
            <p className="text-black mb-4">
              Find tweets from a specific time period. Filter by date range.
            </p>
            <Link href="/date-range" className="block text-center py-2 px-4 bg-orange-600 text-white rounded hover:bg-orange-700 transition">
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* View Jobs Section */}
      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-black">View Scraping Jobs</h2>
        <p className="text-black mb-4">
          View all scraping jobs and their results. Monitor progress and browse collected tweets.
        </p>
        <Link href="/jobs" className="inline-block py-2 px-6 bg-gray-800 text-white rounded hover:bg-gray-900 transition">
          View Jobs
        </Link>
      </div>
    </div>
  );
}
