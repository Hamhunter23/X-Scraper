import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// The function to execute the Python DB query
async function executeDbQuery(operation: string, params: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    // Path to the Python DB interface script
    let scriptPath = path.resolve(process.cwd(), '..', 'db_interface.py');
    
    // Make sure the script exists
    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`DB interface script not found at ${scriptPath}`));
      return;
    }

    // Serialize parameters to pass to Python
    const serializedParams = JSON.stringify(params);
    
    // Spawn the Python process
    const pythonProcess = spawn('python', [
      scriptPath,
      operation,
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

// GET handler to retrieve jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    // If jobId is provided, get that specific job with its tweets
    if (jobId) {
      const jobDetails = await executeDbQuery('get_job_with_tweets', { jobId });
      return NextResponse.json(jobDetails);
    }
    
    // Otherwise, get all jobs
    const jobs = await executeDbQuery('get_all_jobs');
    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error.message },
      { status: 500 }
    );
  }
} 