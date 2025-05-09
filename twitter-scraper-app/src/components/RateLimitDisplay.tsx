'use client';

import { useState, useEffect } from 'react';
import { getRateLimitInfo, getRemainingRequests, getTimeUntilReset } from '../utils/rateLimits';

interface RateLimitDisplayProps {
  scrapeType: string;
  onLimitChange?: (isExhausted: boolean) => void;
}

export default function RateLimitDisplay({ scrapeType, onLimitChange }: RateLimitDisplayProps) {
  const rateLimitInfo = getRateLimitInfo(scrapeType);
  const [remaining, setRemaining] = useState<number>(rateLimitInfo.limit);
  const [resetTime, setResetTime] = useState<string>('');
  const [isLowLimit, setIsLowLimit] = useState<boolean>(false);
  const [isExhausted, setIsExhausted] = useState<boolean>(false);

  useEffect(() => {
    // Update rate limit information
    const updateRateLimits = () => {
      const remainingRequests = getRemainingRequests(rateLimitInfo.endpoint);
      setRemaining(remainingRequests);
      
      // Calculate time until reset
      const msUntilReset = getTimeUntilReset(rateLimitInfo.endpoint);
      if (msUntilReset > 0) {
        const minutes = Math.floor(msUntilReset / (60 * 1000));
        const seconds = Math.floor((msUntilReset % (60 * 1000)) / 1000);
        setResetTime(`${minutes}m ${seconds}s`);
      } else {
        setResetTime('Ready');
      }

      // Flag if we're below 20% of the rate limit
      const isLow = remainingRequests < (rateLimitInfo.limit * 0.2);
      setIsLowLimit(isLow);
      
      // Flag if rate limit is exhausted (0 remaining)
      const exhausted = remainingRequests <= 0;
      setIsExhausted(exhausted);
      
      // Notify parent component about rate limit status if callback exists
      if (onLimitChange && (exhausted !== isExhausted)) {
        onLimitChange(exhausted);
      }
    };

    // Initial update
    updateRateLimits();
    
    // Set up interval to update every second
    const interval = setInterval(updateRateLimits, 1000);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, [rateLimitInfo.endpoint, rateLimitInfo.limit, isExhausted, onLimitChange]);

  return (
    <div className={`mb-4 p-3 border rounded-md ${isExhausted ? 'bg-red-50' : 'bg-gray-100'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h3 className="text-sm font-medium">Rate Limit Information</h3>
          <p className="text-xs text-gray-600">Endpoint: {rateLimitInfo.endpoint}</p>
        </div>
        
        <div className="mt-2 sm:mt-0 flex items-center">
          <div className={`mr-4 ${isExhausted ? 'text-red-600 font-bold' : isLowLimit ? 'text-yellow-600 font-bold' : 'text-green-600'}`}>
            <span className="text-xs">Remaining: </span>
            <span className="font-medium">{remaining}/{rateLimitInfo.limit}</span>
          </div>
          
          {resetTime !== 'Ready' && (
            <div className="text-xs text-gray-600">
              <span>Resets in: </span>
              <span className="font-medium">{resetTime}</span>
            </div>
          )}
        </div>
      </div>
      
      {isExhausted && (
        <div className="mt-2 text-xs text-red-600 font-semibold">
          Rate limit exhausted! Please wait for reset before making more requests.
        </div>
      )}
      
      {isLowLimit && !isExhausted && (
        <div className="mt-2 text-xs text-yellow-600">
          Warning: Rate limit is low. Consider waiting for reset.
        </div>
      )}
    </div>
  );
} 