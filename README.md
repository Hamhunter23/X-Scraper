# X Scraper 0_0

A comprehensive web application for scraping Twitter (X) data with an intuitive UI, database integration, and advanced scraping features.

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Rate Limit Management](#rate-limit-management)
- [Database Schema](#database-schema)
- [Technology Stack](#technology-stack)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

### Comprehensive Scraping Options
- **Search Tweets**: Find tweets containing specific keywords
- **Hashtag Tweets**: Scrape tweets containing specific hashtags
- **User Tweets**: Collect tweets from specific Twitter users, including:
- **Date Range Search**: Search for tweets within a specific time period

### Advanced Functionality
- **Job Management System**: Track and monitor all scraping jobs
- **Database Integration**: Save all scraped tweets to a MySQL database for permanent storage
- **Rate Limit Handling**: Built-in rate limit tracking to avoid hitting Twitter API limits
- **Pagination Support**: Automatically paginates through results to collect the requested number of tweets
- **Full Tweet Metadata**: Captures comprehensive tweet data including:
  - Reply counts
  - Retweet counts
  - Bookmark counts
  - Hashtags
  - Creation timestamps
  - User information

### User Interface
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Job Dashboard**: View all scrape jobs and their results
- **Rate Limit Indicators**: Visual indicators for API rate limits

## Project Structure

```
twitter-scraper/
├── twitter-scraper-app/   # Next.js frontend application
│   ├── public/            # Static assets
│   ├── src/               # Application source code
│   │   ├── app/           # Pages and routes
│   │   │   ├── api/       # API routes
│   │   │   │   ├── jobs/  # Job management API
│   │   │   │   ├── scrape/ # Scraping API endpoints
│   │   │   ├── date-range/ # Date Range search page
│   │   │   ├── hashtag/   # Hashtag search page
│   │   │   ├── jobs/      # Jobs overview page
│   │   │   ├── search/    # General search page
│   │   │   ├── user/      # User tweets page
│   │   ├── components/    # React components
│   │   └── utils/         # Utility functions
├── initialize_db.py       # Database initialization script
├── scraper_api.py         # Python API bridge for frontend
├── db_interface.py        # Database interface functions
├── tweet_scraper_service.py # Core Twitter scraping logic
└── .env                   # Environment variables
```

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16.x or higher
- MySQL database

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd twitter-scraper
```

### Step 2: Install Python Dependencies
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install mysql-connector-python python-dotenv twikit
```

### Step 3: Install JavaScript Dependencies
```bash
cd twitter-scraper-app
npm install
```

### Step 4: Configure Environment Variables
Create a `.env` file in the root directory:

```
# Twitter Credentials
TWITTER_USERNAME=your_username
TWITTER_EMAIL=your_email
TWITTER_PASSWORD=your_password

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
```

### Step 5: Initialize the Database
```bash
python initialize_db.py
```

### Step 6: Start the Application
```bash
cd twitter-scraper-app
npm run dev
```

The application will be available at http://localhost:3000

## Usage

### Search for Tweets by Keyword
1. Navigate to the "Search" page
2. Enter your search query
3. Select search type (Latest, Top, or Media)
4. Choose the number of tweets to retrieve (1-100)
5. Click "Start Scraping"

### Search for Hashtag Tweets
1. Navigate to the "Hashtags" page
2. Enter the hashtag (without the # symbol)
3. Select search type (Latest or Top)
4. Choose the number of tweets to retrieve
5. Click "Start Scraping"

### Scrape User Tweets
1. Navigate to the "User Tweets" page
2. Enter the username (without the @ symbol)
3. Select tweet type (Tweets, Replies, Media, or Likes)
4. Choose the number of tweets to retrieve
5. Click "Start Scraping"

### Search by Date Range
1. Navigate to the "Date Range" page
2. Enter your search query
3. Select start and end dates
4. Choose the number of tweets to retrieve
5. Click "Start Scraping"

### View Scraping Jobs
1. Navigate to the "Jobs" page
2. Browse the list of all scraping jobs
3. Click "View Details" to see job details and scraped tweets

## API Reference

### Scrape API

#### POST /api/scrape
Initiates a scraping job.

**Request Body:**
```json
{
  "type": "SEARCH_TWEETS",
  "params": {
    "query": "example search",
    "searchType": "Latest",
    "count": 30
  }
}
```

**Types:**
- `SEARCH_TWEETS`: General search
- `HASHTAG_TOP_TWEETS`: Hashtag search (top tweets)
- `HASHTAG_LATEST_TWEETS`: Hashtag search (latest tweets)
- `USER_TWEETS`: User tweets
- `DATE_RANGE_TWEETS`: Date range search

**Response:**
```json
{
  "success": true,
  "result": {
    "jobId": 123,
    "tweetCount": 30
  },
  "rateLimitInfo": {
    "endpoint": "SearchTimeline",
    "limit": 50,
    "resetMinutes": 15
  }
}
```

### Jobs API

#### GET /api/jobs
Gets all jobs or a specific job's details.

**Query Parameters:**
- `jobId` (optional): Get details for a specific job

**Response for all jobs:**
```json
{
  "success": true,
  "jobs": [
    {
      "job_id": 123,
      "job_type": "SEARCH_TWEETS",
      "query": "example",
      "parameters": {},
      "start_time": "2023-07-10T12:00:00Z",
      "end_time": "2023-07-10T12:01:30Z",
      "status": "COMPLETED",
      "tweet_count": 30,
      "created_at": "2023-07-10T12:00:00Z"
    }
  ]
}
```

**Response for specific job:**
```json
{
  "success": true,
  "job": {
    "job_id": 123,
    "job_type": "SEARCH_TWEETS",
    "query": "example",
    "parameters": {},
    "start_time": "2023-07-10T12:00:00Z",
    "end_time": "2023-07-10T12:01:30Z",
    "status": "COMPLETED",
    "tweet_count": 30,
    "created_at": "2023-07-10T12:00:00Z"
  },
  "tweets": [
    {
      "id": "tweet_id",
      "user_name": "username",
      "user_id": "user_id",
      "text": "Tweet content",
      "created_at": "2023-07-09T10:00:00Z",
      "reply_count": 5,
      "retweet_count": 10,
      "bookmark_count": 2,
      "hashtags": ["example", "tweet"]
    }
  ]
}
```

## Rate Limit Management

The application implements sophisticated rate limit tracking to prevent hitting Twitter API limits:

- **Automatic Tracking**: Records API usage in localStorage
- **Visual Indicators**: Shows remaining requests and time until reset
- **Form Disabling**: Automatically disables forms when rate limits are reached
- **Reset Countdown**: Displays countdown timer until rate limits reset

### Twitter API Rate Limits

| Function | Endpoint | Limit (per 15 min) |
|----------|----------|----------------|
| Search Tweets | SearchTimeline | 50 |
| Get User Tweets | UserTweets | 50 |
| Get User Replies | UserTweetsAndReplies | 50 |
| Get User Media | UserMedia | 500 |
| Get User Likes | Likes | 500 |

## Database Schema

### Scraping Jobs Table

```sql
CREATE TABLE scraping_jobs (
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
```

### Tweets Table

```sql
CREATE TABLE tweets (
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
```

## Technology Stack

### Frontend
- **Next.js**: React framework for the UI
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API requests
- **React DatePicker**: For date selection
- **TypeScript**: For type safety

### Backend
- **Python**: Core scraping functionality
- **twikit**: Twitter scraping library
- **MySQL**: Database for storing tweets and jobs
- **mysql-connector-python**: Database connection
- **python-dotenv**: Environment variables

## Troubleshooting

### Authentication Issues
If you encounter authentication errors:
1. Check your Twitter credentials in the `.env` file
2. Delete the `cookies.json` file (if it exists) to force re-authentication
3. Ensure your Twitter account is not locked or requiring additional verification

### Database Connection Issues
If database connection fails:
1. Verify MySQL is running
2. Check database credentials in the `.env` file
3. Run `initialize_db.py` again to create the database and tables

### Rate Limit Errors
If hitting rate limits:
1. Wait for the rate limit to reset (15 minutes)
2. Reduce the number of requests by lowering the tweet count
3. Space out your scraping jobs

### Installation Problems
Common installation issues:
1. **MySQL Connector Error**: Ensure you have the proper MySQL development libraries installed
   ```bash
   # Ubuntu/Debian
   sudo apt-get install python3-dev default-libmysqlclient-dev build-essential
   # macOS
   brew install mysql-client
   ```
2. **Node.js Errors**: Make sure you're using a compatible Node.js version (16.x or higher)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

For any questions or support, please open an issue in the GitHub repository. 