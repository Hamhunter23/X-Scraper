#!/usr/bin/env python3
import sys
import json
import asyncio
from tweet_scraper_service import TweetScraperService
from datetime import datetime, timedelta
import pytz

def parse_date(date_str):
    """Parse date string into datetime object"""
    if not date_str:
        return None
    return datetime.fromisoformat(date_str.replace('Z', '+00:00'))

async def handle_search_tweets(params):
    """Handle search tweets request"""
    try:
        query = params.get('query', '')
        search_type = params.get('searchType', 'Latest')
        target_count = int(params.get('count', 30))
        
        if not query:
            return {"error": "Query is required"}
        
        # Initialize the scraper service
        scraper = TweetScraperService()
        initialized = await scraper.initialize()
        
        if not initialized:
            return {"error": "Failed to initialize Twitter client"}
        
        # Create a job
        job_id = scraper.create_job(
            job_type='SEARCH_TWEETS',
            query=query,
            parameters={
                'search_type': search_type,
                'target_count': target_count
            }
        )
        
        if not job_id:
            return {"error": "Failed to create job"}
        
        # Execute the search
        tweet_count = await scraper.search_tweets(job_id, query, search_type, target_count)
        
        return {
            "success": True,
            "jobId": job_id,
            "tweetCount": tweet_count
        }
        
    except Exception as e:
        return {"error": str(e)}

async def handle_hashtag_tweets(params, search_type='Latest'):
    """Handle hashtag tweets request"""
    try:
        hashtag = params.get('hashtag', '')
        target_count = int(params.get('count', 30))
        
        if not hashtag:
            return {"error": "Hashtag is required"}
        
        # Initialize the scraper service
        scraper = TweetScraperService()
        initialized = await scraper.initialize()
        
        if not initialized:
            return {"error": "Failed to initialize Twitter client"}
        
        # Create a job
        job_type = f"HASHTAG_{search_type.upper()}_TWEETS"
        job_id = scraper.create_job(
            job_type=job_type,
            query=hashtag,
            parameters={
                'search_type': search_type,
                'target_count': target_count
            }
        )
        
        if not job_id:
            return {"error": "Failed to create job"}
        
        # Execute the search
        tweet_count = await scraper.search_hashtag_tweets(job_id, hashtag, search_type, target_count)
        
        return {
            "success": True,
            "jobId": job_id,
            "tweetCount": tweet_count
        }
        
    except Exception as e:
        return {"error": str(e)}

async def handle_date_range_tweets(params):
    """Handle date range tweets request"""
    try:
        query = params.get('query', '')
        start_date_str = params.get('startDate')
        end_date_str = params.get('endDate')
        target_count = int(params.get('count', 30))
        
        if not query:
            return {"error": "Query is required"}
        
        if not start_date_str or not end_date_str:
            return {"error": "Start date and end date are required"}
        
        # Parse dates
        start_date = parse_date(start_date_str)
        end_date = parse_date(end_date_str)
        
        if not start_date or not end_date:
            return {"error": "Invalid date format"}
        
        # Initialize the scraper service
        scraper = TweetScraperService()
        initialized = await scraper.initialize()
        
        if not initialized:
            return {"error": "Failed to initialize Twitter client"}
        
        # Create a job
        job_id = scraper.create_job(
            job_type='DATE_RANGE_TWEETS',
            query=query,
            parameters={
                'start_date': start_date_str,
                'end_date': end_date_str,
                'target_count': target_count
            }
        )
        
        if not job_id:
            return {"error": "Failed to create job"}
        
        # Execute the search
        tweet_count = await scraper.search_date_range_tweets(job_id, query, start_date, end_date, target_count)
        
        return {
            "success": True,
            "jobId": job_id,
            "tweetCount": tweet_count
        }
        
    except Exception as e:
        return {"error": str(e)}

async def handle_user_tweets(params):
    """Handle user tweets request"""
    try:
        screen_name = params.get('username', '')
        tweet_type = params.get('tweetType', 'Tweets')
        target_count = int(params.get('count', 30))
        
        if not screen_name:
            return {"error": "Username is required"}
        
        # Initialize the scraper service
        scraper = TweetScraperService()
        initialized = await scraper.initialize()
        
        if not initialized:
            return {"error": "Failed to initialize Twitter client"}
        
        # Create a job
        job_id = scraper.create_job(
            job_type='USER_TWEETS',
            query=screen_name,
            parameters={
                'tweet_type': tweet_type,
                'target_count': target_count
            }
        )
        
        if not job_id:
            return {"error": "Failed to create job"}
        
        # Execute the search
        tweet_count = await scraper.search_user_tweets(job_id, screen_name, tweet_type, target_count)
        
        return {
            "success": True,
            "jobId": job_id,
            "tweetCount": tweet_count
        }
        
    except Exception as e:
        return {"error": str(e)}

async def main():
    """Main function to handle API requests"""
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing required arguments"}))
        return
    
    job_type = sys.argv[1]
    params_json = sys.argv[2]
    
    try:
        params = json.loads(params_json)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON parameters"}))
        return
    
    result = {"error": "Unknown job type"}
    
    if job_type == 'SEARCH_TWEETS':
        result = await handle_search_tweets(params)
    elif job_type == 'HASHTAG_TOP_TWEETS':
        result = await handle_hashtag_tweets(params, 'Top')
    elif job_type == 'HASHTAG_LATEST_TWEETS':
        result = await handle_hashtag_tweets(params, 'Latest')
    elif job_type == 'DATE_RANGE_TWEETS':
        result = await handle_date_range_tweets(params)
    elif job_type == 'USER_TWEETS':
        result = await handle_user_tweets(params)
    
    # Print the result as JSON to be captured by the Node.js process
    print(json.dumps(result))

if __name__ == '__main__':
    asyncio.run(main()) 