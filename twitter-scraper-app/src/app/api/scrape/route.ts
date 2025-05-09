import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getRateLimitInfo } from '@/utils/rateLimits';

// Define scrape types
const SCRAPE_TYPES = {
  SEARCH: 'SEARCH_TWEETS',
  HASHTAG_TOP: 'HASHTAG_TOP_TWEETS',
  HASHTAG_LATEST: 'HASHTAG_LATEST_TWEETS',
  USER: 'USER_TWEETS',
  DATE_RANGE: 'DATE_RANGE_TWEETS',
};

// The function to execute the Python scraper
async function executeScraper(jobType: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Create a command to execute the appropriate Python function based on job type
    let scriptPath = path.resolve(process.cwd(), '..', 'scraper_api.py');
    
    // Make sure the script exists
    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`Scraper script not found at ${scriptPath}`));
      return;
    }

    // Serialize parameters to pass to Python
    const serializedParams = JSON.stringify(params);
    
    // Spawn the Python process
    const pythonProcess = spawn('python', [
      scriptPath,
      jobType,
      serializedParams
    ]);

    // Collect data from script
    let scriptOutput = '';
    let scriptError = '';

    // Collect data from standard output
    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
    });

    // Collect data from standard error
    pythonProcess.stderr.on('data', (data) => {
      scriptError += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        console.error(`Error: ${scriptError}`);
        reject(new Error(`Script execution failed: ${scriptError}`));
        return;
      }

      try {
        // Try to parse the output as JSON
        const result = JSON.parse(scriptOutput);
        resolve(result);
      } catch (error) {
        console.error('Failed to parse script output as JSON:', scriptOutput);
        reject(new Error('Failed to parse script output as JSON'));
      }
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, params } = body;

    // Validate request
    if (!type || !params) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get rate limit info for the endpoint
    const rateLimitInfo = getRateLimitInfo(type);

    // Execute the appropriate scraper based on type
    let result;
    switch (type) {
      case SCRAPE_TYPES.SEARCH:
        result = await executeScraper(SCRAPE_TYPES.SEARCH, params);
        break;
      case SCRAPE_TYPES.HASHTAG_TOP:
        result = await executeScraper(SCRAPE_TYPES.HASHTAG_TOP, params);
        break;
      case SCRAPE_TYPES.HASHTAG_LATEST:
        result = await executeScraper(SCRAPE_TYPES.HASHTAG_LATEST, params);
        break;
      case SCRAPE_TYPES.USER:
        result = await executeScraper(SCRAPE_TYPES.USER, params);
        break;
      case SCRAPE_TYPES.DATE_RANGE:
        result = await executeScraper(SCRAPE_TYPES.DATE_RANGE, params);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid scrape type' },
          { status: 400 }
        );
    }

    // Include rate limit info in the response
    const response = NextResponse.json({ 
      success: true, 
      result,
      rateLimitInfo: {
        endpoint: rateLimitInfo.endpoint,
        limit: rateLimitInfo.limit,
        resetMinutes: rateLimitInfo.resetMinutes
      }
    });

    return response;
  } catch (error: any) {
    console.error('Error processing scrape request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
} 