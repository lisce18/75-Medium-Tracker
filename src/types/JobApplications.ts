export type JobStatus =
	| 'interested'
	| 'applied'
	| 'interview'
	| 'offer'
	| 'rejected'
	| 'withdrawn';

export type JobApplication = {
	id: number;
	userId: string;
	companyName: string;
	jobTitle: string;
	jobUrl: string;
	location: string;
	status: JobStatus;
	appliedDate: string;
	applicationDeadline: string;
	notes: string;
	createdAt: string;
	updatedAt: string;
};

export type JobApplicationForm = {
	companyName: string;
	jobTitle: string;
	jobUrl: string;
	location: string;
	status: JobStatus;
	appliedDate: string;
	applicationDeadline: string;
	notes: string;
};
