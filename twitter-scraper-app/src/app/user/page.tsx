'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import RateLimitDisplay from '@/components/RateLimitDisplay';
import { recordApiRequest } from '@/utils/rateLimits';

export default function UserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scrapeType, setScrapeType] = useState<string>('USER_TWEETS');
  const [isRateLimitExhausted, setIsRateLimitExhausted] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    tweetType: 'Tweets',
    count: 30
  });

  // Update the scrape type when tweet type changes
  useEffect(() => {
    switch(formData.tweetType) {
      case 'Replies':
        setScrapeType('USER_REPLIES');
        break;
      case 'Media':
        setScrapeType('USER_MEDIA');
        break;
      case 'Likes':
        setScrapeType('USER_LIKES');
        break;
      default:
        setScrapeType('USER_TWEETS');
    }
  }, [formData.tweetType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRateLimitChange = (isExhausted: boolean) => {
    setIsRateLimitExhausted(isExhausted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow submission if rate limit is exhausted
    if (isRateLimitExhausted) {
      setError("Cannot make request - rate limit exhausted. Please wait for the limit to reset.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Remove @ symbol if present
      const cleanUsername = formData.username.replace(/^@/, '');
      
      const response = await axios.post('/api/scrape', {
        type: 'USER_TWEETS',
        params: {
          username: cleanUsername,
          tweetType: formData.tweetType,
          count: parseInt(formData.count.toString())
        }
      });

      // Record API usage for rate limit tracking
      if (response.data.rateLimitInfo?.endpoint) {
        recordApiRequest(response.data.rateLimitInfo.endpoint);
      }

      setSuccess(`Successfully scraped ${response.data.result.tweetCount} tweets!`);
      
      // Navigate to the job details page
      setTimeout(() => {
        router.push(`/jobs?jobId=${response.data.result.jobId}`);
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during the scraping process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Search User Tweets</h1>
      
      {/* Rate Limit Display */}
      <RateLimitDisplay 
        scrapeType={scrapeType} 
        onLimitChange={handleRateLimitChange}
      />
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-black font-medium mb-2">
              Twitter Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                @
              </span>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-8 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                placeholder="Enter username without the @ symbol"
                required
                disabled={isRateLimitExhausted}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="tweetType" className="block text-black font-medium mb-2">
              Tweet Type
            </label>
            <select
              id="tweetType"
              name="tweetType"
              value={formData.tweetType}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              disabled={isRateLimitExhausted}
            >
              <option value="Tweets">Tweets</option>
              <option value="Replies">Replies</option>
              <option value="Media">Media</option>
              <option value="Likes">Likes</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="count" className="block text-black font-medium mb-2">
              Number of Tweets
            </label>
            <input
              type="number"
              id="count"
              name="count"
              value={formData.count}
              onChange={handleChange}
              min="1"
              max="100"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
              disabled={isRateLimitExhausted}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || isRateLimitExhausted}
            className={`w-full py-2 px-4 text-white rounded-md ${
              loading || isRateLimitExhausted ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            } transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
            title={isRateLimitExhausted ? "Rate limit exhausted. Wait for reset." : ""}
          >
            {loading ? 'Processing...' : isRateLimitExhausted ? 'Rate Limit Reached' : 'Start Scraping'}
          </button>
        </form>
      </div>
    </div>
  );
} 