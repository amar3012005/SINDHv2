import { getApiUrl } from '../utils/apiUtils';

class JobService {
  constructor() {
    this.baseUrl = getApiUrl('/api');
  }

  // Fetch all available jobs
  async getAllJobs(filters = {}) {
    try {
      console.log('JobService: Fetching jobs with filters:', filters);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.skills) queryParams.append('skills', filters.skills);
      if (filters.workerId) queryParams.append('workerId', filters.workerId);
      
      const url = `${this.baseUrl}/jobs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('JobService: Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('JobService: Response status:', response.status);
      console.log('JobService: Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('JobService: Raw response data:', data);
      
      // Process the jobs to ensure they have all required fields
      const processedJobs = this.processJobs(data);
      console.log('JobService: Processed jobs:', processedJobs.length);
      
      return {
        success: true,
        data: processedJobs,
        count: processedJobs.length
      };
      
    } catch (error) {
      console.error('JobService: Error fetching jobs:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0
      };
    }
  }

  // Process jobs to ensure all required fields are present
  processJobs(jobs) {
    if (!Array.isArray(jobs)) {
      console.warn('JobService: Expected array of jobs, got:', typeof jobs);
      return [];
    }

    return jobs.map((job, index) => {
      console.log(`JobService: Processing job ${index + 1}:`, job?.title || 'Untitled');
      
      // Create a standardized job object
      const processedJob = {
        _id: job._id || job.id || `temp-${index}`,
        id: job._id || job.id || `temp-${index}`,
        title: job.title || `Job Opportunity ${index + 1}`,
        companyName: this.extractCompanyName(job),
        description: this.extractDescription(job),
        salary: this.extractSalary(job),
        location: this.processLocation(job.location),
        category: job.category || job.jobCategory || job.field || 'General',
        employmentType: job.employmentType || job.jobType || job.type || 'Full-time',
        skillsRequired: job.skillsRequired || job.requiredSkills || job.skills || [],
        requirements: job.requirements || job.qualification || 'No specific requirements',
        status: job.status || 'active',
        urgency: job.urgency || job.priority || 'Normal',
        createdAt: job.createdAt || new Date().toISOString(),
        updatedAt: job.updatedAt || new Date().toISOString(),
        employer: job.employer || null,
        contactInfo: job.contactInfo || job.contact || null,
        workingHours: job.workingHours || job.hours || 'Standard hours',
        benefits: job.benefits || [],
        hasApplied: job.hasApplied || false,
        application: job.application || null,
        applicationStatus: job.applicationStatus || null
      };

      console.log(`JobService: Processed job ${index + 1}:`, {
        id: processedJob._id,
        title: processedJob.title,
        company: processedJob.companyName,
        salary: processedJob.salary
      });

      return processedJob;
    });
  }

  // Extract company name from various possible fields
  extractCompanyName(job) {
    return job.companyName || 
           job.company?.name || 
           job.employer?.company?.name || 
           job.employer?.companyName ||
           job.employer?.name ||
           'Company Not Specified';
  }

  // Extract job description
  extractDescription(job) {
    return job.description || 
           job.jobDescription || 
           job.details ||
           `Work opportunity in ${job.location?.city || 'your area'}. Contact employer for more details.`;
  }

  // Extract salary information
  extractSalary(job) {
    return job.salary || 
           job.pay || 
           job.wage || 
           job.compensation ||
           '15,000 - 25,000';
  }

  // Process location object
  processLocation(location) {
    if (!location) {
      return {
        city: 'City Not Specified',
        state: 'State Not Specified',
        street: '',
        pincode: '',
        type: 'onsite'
      };
    }

    return {
      city: location.city || 'City Not Specified',
      state: location.state || 'State Not Specified',
      street: location.street || location.address || '',
      pincode: location.pincode || location.zipcode || '',
      type: location.type || 'onsite'
    };
  }

  // Apply for a job
  async applyForJob(jobId, workerData) {
    try {
      console.log('JobService: Applying for job:', jobId);
      
      const response = await fetch(`${this.baseUrl}/job-applications/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          workerId: workerData.id,
          workerDetails: {
            name: workerData.name,
            phone: workerData.phone,
            skills: workerData.skills || [],
            experience: workerData.experience || '',
            location: workerData.location || {},
            rating: workerData.rating?.average || 0
          }
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit application');
      }

      console.log('JobService: Application submitted successfully');
      return {
        success: true,
        data: result.data || result,
        message: result.message || 'Application submitted successfully'
      };

    } catch (error) {
      console.error('JobService: Error applying for job:', error);
      return {
        success: false,
        error: error.message,
        message: error.message
      };
    }
  }

  // Cancel job application
  async cancelApplication(applicationId) {
    try {
      console.log('JobService: Cancelling application:', applicationId);
      
      const response = await fetch(`${this.baseUrl}/job-applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to cancel application');
      }

      console.log('JobService: Application cancelled successfully');
      return {
        success: true,
        message: result.message || 'Application cancelled successfully'
      };

    } catch (error) {
      console.error('JobService: Error cancelling application:', error);
      return {
        success: false,
        error: error.message,
        message: error.message
      };
    }
  }

  // Get worker's applications
  async getWorkerApplications(workerId) {
    try {
      console.log('JobService: Fetching applications for worker:', workerId);
      
      const response = await fetch(`${this.baseUrl}/job-applications/worker/${workerId}/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('JobService: Worker applications:', result);
      
      return {
        success: true,
        data: result.data || result,
        count: result.count || (result.data ? result.data.length : 0)
      };

    } catch (error) {
      console.error('JobService: Error fetching worker applications:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0
      };
    }
  }

  // Get job by ID
  async getJobById(jobId) {
    try {
      console.log('JobService: Fetching job by ID:', jobId);
      
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const job = await response.json();
      const processedJobs = this.processJobs([job]);
      
      return {
        success: true,
        data: processedJobs[0] || null
      };

    } catch (error) {
      console.error('JobService: Error fetching job by ID:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

// Create and export a singleton instance
const jobService = new JobService();
export default jobService;

// Export individual methods for convenience
export const {
  getAllJobs,
  applyForJob,
  cancelApplication,
  getWorkerApplications,
  getJobById
} = jobService;