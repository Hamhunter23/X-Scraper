#!/usr/bin/env python3
import sys
import json
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_db():
    """Connect to the MySQL database"""
    try:
        # Database connection parameters
        host = os.getenv('DB_HOST', 'localhost')
        user = os.getenv('DB_USER', 'root')
        password = os.getenv('DB_PASSWORD', '')
        db_name = 'xdb'
        
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=db_name
        )
        return connection
    except Error as e:
        print(json.dumps({"error": f"Error connecting to MySQL database: {str(e)}"}))
        sys.exit(1)

def get_all_jobs():
    """Get all scraping jobs"""
    try:
        connection = connect_to_db()
        cursor = connection.cursor(dictionary=True)
        
        # SQL query to get all jobs
        query = """
            SELECT * FROM scraping_jobs
            ORDER BY job_id DESC
        """
        
        cursor.execute(query)
        jobs = cursor.fetchall()
        
        # Process the results
        processed_jobs = []
        for job in jobs:
            # Parse JSON fields
            if job['parameters'] and isinstance(job['parameters'], str):
                try:
                    job['parameters'] = json.loads(job['parameters'])
                except:
                    job['parameters'] = {}
            
            # Format date fields for JSON
            if job['start_time']:
                job['start_time'] = job['start_time'].isoformat()
            if job['end_time']:
                job['end_time'] = job['end_time'].isoformat()
            if job['created_at']:
                job['created_at'] = job['created_at'].isoformat()
                
            processed_jobs.append(job)
            
        return {"success": True, "jobs": processed_jobs}
        
    except Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

def get_job_with_tweets(params):
    """Get a specific job with its tweets"""
    try:
        job_id = params.get('jobId')
        if not job_id:
            return {"error": "Job ID is required"}
            
        connection = connect_to_db()
        cursor = connection.cursor(dictionary=True)
        
        # Get job details
        job_query = """
            SELECT * FROM scraping_jobs
            WHERE job_id = %s
        """
        cursor.execute(job_query, (job_id,))
        job = cursor.fetchone()
        
        if not job:
            return {"error": "Job not found"}
            
        # Parse job parameters
        if job['parameters'] and isinstance(job['parameters'], str):
            try:
                job['parameters'] = json.loads(job['parameters'])
            except:
                job['parameters'] = {}
                
        # Format job date fields
        if job['start_time']:
            job['start_time'] = job['start_time'].isoformat()
        if job['end_time']:
            job['end_time'] = job['end_time'].isoformat()
        if job['created_at']:
            job['created_at'] = job['created_at'].isoformat()
        
        # Get tweets for this job
        tweets_query = """
            SELECT * FROM tweets
            WHERE job_id = %s
            ORDER BY created_at DESC
        """
        cursor.execute(tweets_query, (job_id,))
        tweets = cursor.fetchall()
        
        # Process tweets
        processed_tweets = []
        for tweet in tweets:
            # Parse JSON fields
            if tweet['hashtags'] and isinstance(tweet['hashtags'], str):
                try:
                    tweet['hashtags'] = json.loads(tweet['hashtags'])
                except:
                    tweet['hashtags'] = []
                    
            if tweet['raw_data'] and isinstance(tweet['raw_data'], str):
                try:
                    tweet['raw_data'] = json.loads(tweet['raw_data'])
                except:
                    tweet['raw_data'] = {}
            
            # Format date fields
            if tweet['created_at']:
                tweet['created_at'] = tweet['created_at'].isoformat()
            if tweet['indexed_at']:
                tweet['indexed_at'] = tweet['indexed_at'].isoformat()
                
            processed_tweets.append(tweet)
        
        return {
            "success": True,
            "job": job,
            "tweets": processed_tweets
        }
        
    except Error as e:
        return {"error": f"Database error: {str(e)}"}
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

def main():
    """Main function to handle database operations"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Operation is required"}))
        return
        
    operation = sys.argv[1]
    
    # Parse parameters if provided
    params = {}
    if len(sys.argv) > 2:
        try:
            params = json.loads(sys.argv[2])
        except json.JSONDecodeError:
            print(json.dumps({"error": "Invalid JSON parameters"}))
            return
    
    # Execute the requested operation
    result = {"error": "Unknown operation"}
    
    if operation == "get_all_jobs":
        result = get_all_jobs()
    elif operation == "get_job_with_tweets":
        result = get_job_with_tweets(params)
    
    # Print the result as JSON to be captured by the Node.js process
    print(json.dumps(result))

if __name__ == "__main__":
    main() 