'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import RateLimitDisplay from '@/components/RateLimitDisplay';
import { recordApiRequest } from '@/utils/rateLimits';

export default function DateRangePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scrapeType, setScrapeType] = useState<string>('DATE_RANGE_TWEETS');
  const [isRateLimitExhausted, setIsRateLimitExhausted] = useState(false);
  
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  
  const [formData, setFormData] = useState({
    query: '',
    startDate: oneWeekAgo,
    endDate: today,
    count: 30
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [name]: date
      }));
    }
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
      // Validate dates
      if (formData.startDate > formData.endDate) {
        throw new Error('Start date cannot be after end date');
      }
      
      const response = await axios.post('/api/scrape', {
        type: 'DATE_RANGE_TWEETS',
        params: {
          query: formData.query,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
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
      setError(err.response?.data?.error || err.message || 'An error occurred during the scraping process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Search Tweets by Date Range</h1>
      
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
            <label htmlFor="query" className="block text-black font-medium mb-2">
              Search Query
            </label>
            <input
              type="text"
              id="query"
              name="query"
              value={formData.query}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
              placeholder="Enter keywords or phrases"
              required
              disabled={isRateLimitExhausted}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-black font-medium mb-2">
                Start Date
              </label>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
                maxDate={today}
                dateFormat="yyyy-MM-dd"
                disabled={isRateLimitExhausted}
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-black font-medium mb-2">
                End Date
              </label>
              <DatePicker
                selected={formData.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
                maxDate={today}
                minDate={formData.startDate}
                dateFormat="yyyy-MM-dd"
                disabled={isRateLimitExhausted}
              />
            </div>
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
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
              disabled={isRateLimitExhausted}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || isRateLimitExhausted}
            className={`w-full py-2 px-4 text-white rounded-md ${
              loading || isRateLimitExhausted ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
            } transition focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
            title={isRateLimitExhausted ? "Rate limit exhausted. Wait for reset." : ""}
          >
            {loading ? 'Processing...' : isRateLimitExhausted ? 'Rate Limit Reached' : 'Start Scraping'}
          </button>
        </form>
      </div>
    </div>
  );
} 