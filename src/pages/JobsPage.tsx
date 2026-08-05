import { useEffect, useState } from 'react';
import type {
	JobApplication,
	JobApplicationForm,
	JobStatus,
} from '../types/JobApplications';
import JobsFilter from '../components/jobs/JobsFilter';
import JobsList from '../components/jobs/JobsList';
import JobForm from '../components/jobs/JobForm';
import {
	createJobApplication,
	deleteJobApplication,
	fetchJobApplications,
	updateJobApplication,
} from '../services/jobApplications';

const emptyForm: JobApplicationForm = {
	companyName: '',
	jobTitle: '',
	jobUrl: '',
	location: '',
	status: 'applied',
	appliedDate: new Date().toISOString().split('T')[0],
	applicationDeadline: '',
	notes: '',
};

export default function JobsPage() {
	const [jobs, setJobs] = useState<JobApplication[]>([]);
	const [form, setForm] = useState<JobApplicationForm>(emptyForm);
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState('');
	const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
	const [editingJobId, setEditingJobId] = useState<number | null>(null);
	const [saving, setSaving] = useState(false);
	const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

	useEffect(() => {
		void fetchJobs();
	}, []);

	async function fetchJobs() {
		setLoading(true);

		try {
			const fetchedJobs = await fetchJobApplications();
			setJobs(fetchedJobs);
		} catch (error) {
			console.error('Kunde inte hämta jobbansökningar: ', error);

			setMessage(
				error instanceof Error
					? error.message
					: 'Ett oväntat fel inträffade när jobben hämtades.',
			);
		} finally {
			setLoading(false);
		}
	}

	function updateForm<K extends keyof JobApplicationForm>(
		key: K,
		value: JobApplicationForm[K],
	) {
		setForm((currentForm) => ({
			...currentForm,
			[key]: value,
		}));
	}

	const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (
		e,
	) => {
		e.preventDefault();
		setMessage('');

		if (!form.companyName.trim() || !form.jobTitle.trim()) {
			setMessage('Företagsnamn och jobbtitel måste fyllas i.');
			return;
		}

		setSaving(true);

		try {
			if (editingJobId !== null) {
				await updateJobApplication(editingJobId, form);
			} else {
				await createJobApplication(form);
			}

			setForm(emptyForm);
			setEditingJobId(null);
			setMessage(
				editingJobId
					? 'Jobbet har uppdaterats'
					: 'Jobbet har lagts till',
			);

			await fetchJobs();
		} catch (error) {
			console.error('Kunde inte spara jobbet: ', error);

			setMessage(
				error instanceof Error
					? error.message
					: 'Ett oväntat fel inträffade när jobbet sparades.',
			);

			return;
		} finally {
			setSaving(false);
		}
	};

	function handleEdit(job: JobApplication) {
		setEditingJobId(job.id);

		setForm({
			companyName: job.companyName,
			jobTitle: job.jobTitle,
			jobUrl: job.jobUrl,
			location: job.location,
			status: job.status,
			appliedDate: job.appliedDate,
			applicationDeadline: job.applicationDeadline,
			notes: job.notes,
		});

		setMessage('');

		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}

	function handleCancelEdit() {
		setEditingJobId(null);
		setForm(emptyForm);
		setMessage('');
	}

	async function handleDelete(job: JobApplication) {
		const shouldDelete = window.confirm(
			`Vill du verkligen ta bort ${job.jobTitle} hos ${job.companyName}?`,
		);

		if (!shouldDelete) {
			return;
		}

		setMessage('');
		setDeletingJobId(job.id);

		try {
			await deleteJobApplication(job.id);

			if (editingJobId === job.id) {
				setEditingJobId(null);
				setForm(emptyForm);
			}

			setMessage('Jobbet har tagits bort.');
			await fetchJobs();
		} catch (error) {
			console.error('Kunde inte ta bort jobbet: ', error);

			setMessage(
				error instanceof Error
					? error.message
					: 'Ett oväntat fel uppstod när jobbet togs bort.',
			);

			return;
		} finally {
			setDeletingJobId(null);
		}

		if (editingJobId === job.id) {
			setEditingJobId(null);
			setForm(emptyForm);
		}

		setMessage('Jobbet har tagits bort.');
		await fetchJobs();
	}

	const filteredJobs =
		statusFilter === 'all'
			? jobs
			: jobs.filter((job) => job.status === statusFilter);

	return (
		<div className='jobs-page'>
			<JobForm
				form={form}
				editingJobId={editingJobId}
				jobsCount={jobs.length}
				message={message}
				isSaving={saving}
				onSubmit={handleSubmit}
				onChange={updateForm}
				onCancelEdit={handleCancelEdit}
			/>

			<section className='card jobs-table-card'>
				<JobsFilter
					statusFilter={statusFilter}
					onStatusFilterChange={setStatusFilter}
				/>
				<JobsList
					jobs={filteredJobs}
					loading={loading}
					deletingJobId={deletingJobId}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</section>
		</div>
	);
}
