'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

type Tweet = {
  id: string;
  user_name: string;
  text: string;
  created_at: string;
  reply_count: number;
  retweet_count: number;
  bookmark_count: number;
  hashtags: string[];
};

type Job = {
  job_id: number;
  job_type: string;
  query: string;
  parameters: any;
  start_time: string;
  end_time: string | null;
  status: string;
  tweet_count: number;
  created_at: string;
};

export default function JobsPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);

  // Load jobs or specific job with tweets
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (jobId) {
          // Fetch specific job with tweets
          const response = await axios.get(`/api/jobs?jobId=${jobId}`);
          if (response.data.success) {
            setSelectedJob(response.data.job);
            setTweets(response.data.tweets);
            setJobs([response.data.job]); // Also set jobs array with just this job
          } else {
            setError(response.data.error || 'Failed to fetch job details');
          }
        } else {
          // Fetch all jobs
          const response = await axios.get('/api/jobs');
          if (response.data.success) {
            setJobs(response.data.jobs);
          } else {
            setError(response.data.error || 'Failed to fetch jobs');
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [jobId]);

  // Handle job selection
  const handleJobSelect = async (job: Job) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/jobs?jobId=${job.job_id}`);
      if (response.data.success) {
        setSelectedJob(response.data.job);
        setTweets(response.data.tweets);
      } else {
        setError(response.data.error || 'Failed to fetch job details');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred while fetching job details');
    } finally {
      setLoading(false);
    }
  };

  // Format job type for display
  const formatJobType = (jobType: string) => {
    return jobType.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'RUNNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Scraping Jobs</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {loading && !selectedJob ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-black">Loading jobs...</p>
        </div>
      ) : (
        <>
          {/* Jobs List Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-4 bg-gray-100 border-b">
              <h2 className="text-xl font-semibold text-black">All Jobs</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Tweets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-black">
                        No jobs found
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.job_id} className={selectedJob?.job_id === job.job_id ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                          {job.job_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {formatJobType(job.job_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black max-w-xs truncate">
                          {job.query}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {formatDate(job.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {job.tweet_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleJobSelect(job)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Job Details and Tweets Section */}
          {selectedJob && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-100 border-b">
                <h2 className="text-xl font-semibold text-black">Job Details</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-black">Job ID</h3>
                    <p className="mt-1 text-black">{selectedJob.job_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-black">Type</h3>
                    <p className="mt-1 text-black">{formatJobType(selectedJob.job_type)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-black">Query</h3>
                    <p className="mt-1 text-black">{selectedJob.query}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-black">Status</h3>
                    <p className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedJob.status)}`}>
                        {selectedJob.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-black">Started</h3>
                    <p className="mt-1 text-black">{formatDate(selectedJob.start_time)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-black">Completed</h3>
                    <p className="mt-1 text-black">{selectedJob.end_time ? formatDate(selectedJob.end_time) : 'Not completed'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-black">Tweet Count</h3>
                    <p className="mt-1 text-black">{selectedJob.tweet_count}</p>
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-4 text-black">Loading tweets...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-4 text-black">Tweets</h3>
                    
                    {tweets.length === 0 ? (
                      <div className="p-4 bg-gray-50 rounded text-black">
                        No tweets found for this job.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tweets.map(tweet => (
                          <div key={tweet.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium text-black">{tweet.user_name}</span>
                              <span className="text-sm text-black">{new Date(tweet.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-black mb-3">{tweet.text}</p>
                            <div className="flex items-center text-sm space-x-4">
                              <span className="flex items-center text-black">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                </svg>
                                {tweet.reply_count}
                              </span>
                              <span className="flex items-center text-black">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {tweet.retweet_count}
                              </span>
                              <span className="flex items-center text-black">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" clipRule="evenodd" />
                                </svg>
                                {tweet.bookmark_count}
                              </span>
                            </div>
                            {tweet.hashtags && tweet.hashtags.length > 0 && (
                              <div className="mt-2">
                                {tweet.hashtags.map(tag => (
                                  <span key={tag} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2 mb-1">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
} 