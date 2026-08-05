import { supabase } from '../lib/supabase';
import type {
	JobApplication,
	JobApplicationForm,
} from '../types/JobApplications';

function toJobApplicationRow(form: JobApplicationForm) {
	return {
		company_name: form.companyName.trim(),
		job_title: form.jobTitle.trim(),
		job_url: form.jobUrl.trim() || null,
		location: form.location.trim() || null,
		status: form.status,
		applied_date: form.appliedDate || null,
		application_deadline: form.applicationDeadline || null,
		notes: form.notes.trim() || null,
		updated_at: new Date().toISOString(),
	};
}

export async function fetchJobApplications(): Promise<JobApplication[]> {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		throw new Error(
			'Du måste vara inloggad för att se dina jobbansökningar.',
		);
	}

	const { data, error } = await supabase
		.from('job_applications')
		.select('*')
		.eq('user_id', session.user.id)
		.order('applied_date', { ascending: false });

	if (error) {
		throw new Error(`Kunde inte hämta jobbansökningar: ${error.message}`);
	}

	return (data ?? []).map((job) => ({
		id: job.id,
		userId: job.user_id,
		companyName: job.company_name,
		jobTitle: job.job_title,
		jobUrl: job.job_url ?? '',
		location: job.location ?? '',
		status: job.status,
		appliedDate: job.applied_date ?? '',
		applicationDeadline: job.application_deadline ?? '',
		notes: job.notes ?? '',
		createdAt: job.created_at,
		updatedAt: job.updated_at,
	}));
}

export async function createJobApplication(
	form: JobApplicationForm,
): Promise<void> {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		throw new Error(
			'Du måste vara inloggad för att kunna lägga till ett jobb.',
		);
	}

	const { error } = await supabase.from('job_applications').insert({
		...toJobApplicationRow(form),
		user_id: session.user.id,
	});

	if (error) {
		throw new Error(`Kunde inte lägga till jobbet: ${error.message}`);
	}
}

export async function updateJobApplication(
	jobId: number,
	form: JobApplicationForm,
): Promise<void> {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		throw new Error(
			'Du måste vara inloggad för att kunna redigera ett jobb.',
		);
	}

	const { error } = await supabase
		.from('job_applications')
		.update(toJobApplicationRow(form))
		.eq('id', jobId)
		.eq('user_id', session.user.id);

	if (error) {
		throw new Error(`Kunde inte uppdatera jobbet: ${error.message}`);
	}
}

export async function deleteJobApplication(jobId: number): Promise<void> {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session) {
		throw new Error(
			'Du måste vara inloggad för att kunna ta bort ett jobb.',
		);
	}

	const { error } = await supabase
		.from('job_applications')
		.delete()
		.eq('id', jobId)
		.eq('user_id', session.user.id);

	if (error) {
		throw new Error(`Kunde inte ta bort jobbet: ${error.message}`);
	}
}
