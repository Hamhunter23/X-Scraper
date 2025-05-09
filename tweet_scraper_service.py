import asyncio
from twikit import Client
from typing import List, Dict, Any, Optional
import os
import json
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import pytz
import re

# Load environment variables
load_dotenv()

class TweetScraperService:
    def __init__(self):
        self.client = Client('en-US')
        self.username = os.getenv('TWITTER_USERNAME')
        self.email = os.getenv('TWITTER_EMAIL')
        self.password = os.getenv('TWITTER_PASSWORD')
        
        # Database connection parameters
        self.db_host = os.getenv('DB_HOST', 'localhost')
        self.db_user = os.getenv('DB_USER', 'root')
        self.db_password = os.getenv('DB_PASSWORD', '')
        self.db_name = 'xdb'
        
        if not all([self.username, self.email, self.password]):
            raise ValueError("Missing Twitter credentials. Check your .env file.")

    async def initialize(self):
        """Initialize the Twitter client"""
        try:
            # First try to load cookies
            if os.path.exists('cookies.json'):
                self.client.load_cookies('cookies.json')
                print("Successfully loaded cookies")
                return True
            else:
                print("No cookies file found, attempting to login with credentials")
                # If cookies don't exist, try to login with credentials
                await self.client.login(self.email, self.username, self.password)
                print("Successfully logged in with credentials")
                return True
        except Exception as e:
            print(f"Error during initialization: {e}")
            return False

    def connect_to_db(self):
        """Connect to the MySQL database"""
        try:
            connection = mysql.connector.connect(
                host=self.db_host,
                user=self.db_user,
                password=self.db_password,
                database=self.db_name
            )
            return connection
        except Error as e:
            print(f"Error connecting to MySQL database: {e}")
            return None

    def create_job(self, job_type: str, query: str, parameters: Dict = None) -> Optional[int]:
        """Create a new scraping job in the database"""
        try:
            connection = self.connect_to_db()
            if connection is None:
                return None
                
            cursor = connection.cursor()
            
            # Convert parameters dict to JSON string
            params_json = json.dumps(parameters) if parameters else None
            
            # Insert new job
            query_sql = """
                INSERT INTO scraping_jobs 
                (job_type, query, parameters, start_time, status) 
                VALUES (%s, %s, %s, %s, %s)
            """
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute(query_sql, (job_type, query, params_json, current_time, 'RUNNING'))
            
            # Get the job_id of the newly created job
            job_id = cursor.lastrowid
            connection.commit()
            
            print(f"Created new scraping job with ID: {job_id}")
            return job_id
            
        except Error as e:
            print(f"Error creating job: {e}")
            return None
        finally:
            if 'connection' in locals() and connection.is_connected():
                cursor.close()
                connection.close()

    def update_job_status(self, job_id: int, status: str, tweet_count: int = None):
        """Update the status of a scraping job"""
        try:
            connection = self.connect_to_db()
            if connection is None:
                return
                
            cursor = connection.cursor()
            
            if status == 'COMPLETED' or status == 'FAILED':
                # Update status and end time for completed or failed jobs
                current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                query = """
                    UPDATE scraping_jobs 
                    SET status = %s, end_time = %s, tweet_count = %s
                    WHERE job_id = %s
                """
                cursor.execute(query, (status, current_time, tweet_count, job_id))
            else:
                # Just update status for other states
                query = "UPDATE scraping_jobs SET status = %s WHERE job_id = %s"
                cursor.execute(query, (status, job_id))
                
            connection.commit()
            
        except Error as e:
            print(f"Error updating job status: {e}")
        finally:
            if 'connection' in locals() and connection.is_connected():
                cursor.close()
                connection.close()

    def save_tweets(self, job_id: int, tweets: List):
        """Save tweets to the database"""
        try:
            connection = self.connect_to_db()
            if connection is None:
                return
                
            cursor = connection.cursor()
            tweets_saved = 0
            
            for tweet in tweets:
                # Extract hashtags from tweet text
                hashtags = re.findall(r'#(\w+)', tweet.text)
                
                # Create a serializable version of the tweet data
                tweet_data = {
                    'id': tweet.id,
                    'text': tweet.text,
                    'user_name': tweet.user.name,
                    'user_id': tweet.user.id,
                    'created_at': tweet.created_at.strftime('%Y-%m-%d %H:%M:%S') if hasattr(tweet, 'created_at') else None,
                    'reply_count': getattr(tweet, 'reply_count', 0),
                    'retweet_count': getattr(tweet, 'retweet_count', 0),
                    'bookmark_count': getattr(tweet, 'bookmark_count', 0)
                }
                
                # Insert tweet data
                query = """
                    INSERT INTO tweets 
                    (id, job_id, user_name, user_id, text, created_at, reply_count, retweet_count, 
                     bookmark_count, hashtags, raw_data)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                    job_id = %s,
                    user_name = %s,
                    text = %s,
                    reply_count = %s,
                    retweet_count = %s,
                    bookmark_count = %s,
                    hashtags = %s,
                    raw_data = %s
                """
                
                values = (
                    tweet.id, job_id, tweet.user.name, tweet.user.id, tweet.text, 
                    tweet_data['created_at'], tweet_data['reply_count'], 
                    tweet_data['retweet_count'], tweet_data['bookmark_count'],
                    json.dumps(hashtags), json.dumps(tweet_data),
                    # For ON DUPLICATE KEY UPDATE
                    job_id, tweet.user.name, tweet.text, 
                    tweet_data['reply_count'], tweet_data['retweet_count'], 
                    tweet_data['bookmark_count'], json.dumps(hashtags), json.dumps(tweet_data)
                )
                
                cursor.execute(query, values)
                tweets_saved += 1
                
            connection.commit()
            print(f"Saved {tweets_saved} tweets to database")
            return tweets_saved
            
        except Error as e:
            print(f"Error saving tweets: {e}")
            return 0
        finally:
            if 'connection' in locals() and connection.is_connected():
                cursor.close()
                connection.close()

    async def search_tweets(self, job_id: int, query: str, search_type: str = 'Latest', target_count: int = 30):
        """
        Search for tweets and save them to the database
        
        Args:
            job_id: The ID of the scraping job
            query: The search query
            search_type: Type of tweets to retrieve ('Latest', 'Top', 'Media')
            target_count: Target number of tweets to fetch
        """
        try:
            total_tweets = 0
            page = 1
            current_tweets = None

            while total_tweets < target_count:
                if page == 1:
                    # Get initial page of tweets
                    current_tweets = await self.client.search_tweet(query, search_type)
                    print(f"\nFetching initial page of tweets for query: {query}")
                else:
                    print(f"\nFetching page {page} of tweets...")
                    current_tweets = await current_tweets.next()
                
                if not current_tweets:
                    print("No more tweets available")
                    break

                # Calculate how many tweets we can use without exceeding target
                remaining = target_count - total_tweets
                tweets_to_use = current_tweets[:remaining]
                
                # Save tweets to database
                saved_count = self.save_tweets(job_id, tweets_to_use)
                total_tweets += saved_count
                
                print(f"\nTotal tweets fetched so far: {total_tweets}")
                
                if total_tweets >= target_count:
                    print(f"\nReached target count of {target_count} tweets")
                    break
                
                page += 1

            # Update job status
            self.update_job_status(job_id, 'COMPLETED', total_tweets)
            print(f"\nFinal tweet count: {total_tweets}")
            return total_tweets
                
        except Exception as e:
            print(f"Error searching tweets: {e}")
            self.update_job_status(job_id, 'FAILED')
            return 0

    async def search_hashtag_tweets(self, job_id: int, hashtag: str, search_type: str = 'Latest', target_count: int = 30):
        """
        Search for tweets with a specific hashtag
        
        Args:
            job_id: The ID of the scraping job
            hashtag: The hashtag to search for
            search_type: Type of tweets to retrieve ('Latest', 'Top')
            target_count: Target number of tweets to fetch
        """
        # Remove # if present to avoid double hashtag
        clean_hashtag = hashtag.lstrip('#')
        query = f"#{clean_hashtag}"
        
        return await self.search_tweets(job_id, query, search_type, target_count)

    async def search_date_range_tweets(self, job_id: int, query: str, start_date: datetime, 
                                       end_date: datetime, target_count: int = 30):
        """
        Search for tweets within a date range
        
        Args:
            job_id: The ID of the scraping job
            query: The search query
            start_date: Start date
            end_date: End date
            target_count: Target number of tweets to fetch
        """
        try:
            # Format dates as YYYY-MM-DD
            start_str = start_date.strftime('%Y-%m-%d')
            end_str = end_date.strftime('%Y-%m-%d')
            
            # Add date range to query
            date_query = f"{query} since:{start_str} until:{end_str}"
            print(f"\nSearching for tweets with query: {date_query}")
            
            return await self.search_tweets(job_id, date_query, 'Latest', target_count)
                
        except Exception as e:
            print(f"Error fetching tweets by date range: {e}")
            self.update_job_status(job_id, 'FAILED')
            return 0

    async def search_user_tweets(self, job_id: int, screen_name: str, tweet_type: str = 'Tweets', target_count: int = 30):
        """
        Fetch tweets from a specific user
        
        Args:
            job_id: The ID of the scraping job
            screen_name: Twitter screen name (username)
            tweet_type: Type of tweets to retrieve ('Tweets', 'Replies', 'Media', 'Likes')
            target_count: Target number of tweets to fetch
        """
        try:
            # First get the user ID
            user = await self.client.get_user_by_screen_name(screen_name)
            if not user:
                print(f"Could not find user: {screen_name}")
                self.update_job_status(job_id, 'FAILED')
                return 0

            user_id = user.id
            print(f"\nFetching {tweet_type} for user: {screen_name} (ID: {user_id})")
            
            total_tweets = 0
            page = 1
            current_tweets = None

            while total_tweets < target_count:
                if page == 1:
                    # Get initial page of tweets
                    current_tweets = await self.client.get_user_tweets(user_id, tweet_type)
                    print(f"\nFetching initial page of {tweet_type}")
                else:
                    print(f"\nFetching page {page} of {tweet_type}...")
                    current_tweets = await current_tweets.next()
                
                if not current_tweets:
                    print("No more tweets available")
                    break

                # Calculate how many tweets we can use without exceeding target
                remaining = target_count - total_tweets
                tweets_to_use = current_tweets[:remaining]
                
                # Save tweets to database
                saved_count = self.save_tweets(job_id, tweets_to_use)
                total_tweets += saved_count
                
                print(f"\nTotal tweets fetched so far: {total_tweets}")
                
                if total_tweets >= target_count:
                    print(f"\nReached target count of {target_count} tweets")
                    break
                
                page += 1

            # Update job status
            self.update_job_status(job_id, 'COMPLETED', total_tweets)
            print(f"\nFinal tweet count: {total_tweets}")
            return total_tweets
                
        except Exception as e:
            print(f"Error fetching user tweets: {e}")
            self.update_job_status(job_id, 'FAILED')
            return 0

# Example of how to use this service (not executed by importing the module)
async def example_usage():
    # Create an instance of the service
    scraper = TweetScraperService()
    
    # Initialize the client
    initialized = await scraper.initialize()
    if not initialized:
        print("Failed to initialize Twitter client")
        return
    
    # Create a new job for searching tweets
    job_id = scraper.create_job(
        job_type='SEARCH_TWEETS',
        query='python',
        parameters={'search_type': 'Latest', 'target_count': 10}
    )
    
    if job_id:
        # Search for tweets
        await scraper.search_tweets(job_id, 'python', 'Latest', 10)

# Only run the example when this file is executed directly
if __name__ == "__main__":
    asyncio.run(example_usage()) 