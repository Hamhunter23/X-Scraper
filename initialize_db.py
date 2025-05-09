import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def create_database():
    """Create the database and required tables"""
    
    # Database connection parameters
    host = os.getenv('DB_HOST', 'localhost')
    user = os.getenv('DB_USER', 'root')
    password = os.getenv('DB_PASSWORD', '')
    
    try:
        # Connect to MySQL server
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Create database if it doesn't exist
            cursor.execute("CREATE DATABASE IF NOT EXISTS xdb")
            print("Database 'xdb' created or already exists")
            
            # Switch to the xdb database
            cursor.execute("USE xdb")
            
            # Create scraping_jobs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scraping_jobs (
                    job_id INT AUTO_INCREMENT PRIMARY KEY,
                    job_type VARCHAR(50) NOT NULL,
                    query VARCHAR(255) NOT NULL,
                    parameters JSON,
                    start_time DATETIME NOT NULL,
                    end_time DATETIME,
                    status VARCHAR(20) NOT NULL,
                    tweet_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("Table 'scraping_jobs' created or already exists")
            
            # Create tweets table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tweets (
                    id VARCHAR(255) PRIMARY KEY,
                    job_id INT,
                    user_name VARCHAR(255),
                    user_id VARCHAR(255),
                    text TEXT,
                    created_at DATETIME,
                    reply_count INT DEFAULT 0,
                    retweet_count INT DEFAULT 0,
                    bookmark_count INT DEFAULT 0,
                    hashtags JSON,
                    raw_data JSON,
                    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (job_id) REFERENCES scraping_jobs(job_id)
                )
            """)
            print("Table 'tweets' created or already exists")
            
            # Create index for faster lookups
            try:
                # Check if indexes exist before dropping
                cursor.execute("""
                    SELECT COUNT(1) IndexIsThere FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE table_schema=DATABASE() AND table_name='tweets' 
                    AND index_name='idx_tweets_job_id'
                """)
                if cursor.fetchone()[0]:
                    cursor.execute("DROP INDEX idx_tweets_job_id ON tweets")
                
                cursor.execute("CREATE INDEX idx_tweets_job_id ON tweets(job_id)")
                
                cursor.execute("""
                    SELECT COUNT(1) IndexIsThere FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE table_schema=DATABASE() AND table_name='tweets' 
                    AND index_name='idx_tweets_created_at'
                """)
                if cursor.fetchone()[0]:
                    cursor.execute("DROP INDEX idx_tweets_created_at ON tweets")
                    
                cursor.execute("CREATE INDEX idx_tweets_created_at ON tweets(created_at)")
                print("Indexes created successfully")
            except Error as e:
                print(f"Warning when creating indexes: {e}")
            
            print("Database initialization completed successfully!")
            
    except Error as e:
        print(f"Error: {e}")
    
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection closed")

if __name__ == "__main__":
    create_database() 