import type { JobStatus } from '../types/JobApplications';

export const jobStatusLabels: Record<JobStatus, string> = {
	interested: 'Intresserad',
	applied: 'Ansökt',
	interview: 'Intervju',
	offer: 'Erbjudande',
	rejected: 'Avslag',
	withdrawn: 'Tillbakadragen',
};

export const jobStatusOptions: JobStatus[] = [
	'interested',
	'applied',
	'interview',
	'offer',
	'rejected',
	'withdrawn',
];
