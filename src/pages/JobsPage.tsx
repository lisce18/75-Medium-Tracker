import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { jobStatusLabels, jobStatusOptions } from '../constants/jobStatuses';
import type {
	JobApplication,
	JobApplicationForm,
	JobStatus,
} from '../types/JobApplications';

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

	useEffect(() => {
		void fetchJobs();
	}, []);

	async function fetchJobs() {
		setLoading(true);

		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			setMessage(
				'Du måste vara inloggad för att se dina jobbansökningar.',
			);
			setLoading(false);
			return;
		}

		const { data, error } = await supabase
			.from('job_applications')
			.select('*')
			.eq('user_id', session.user.id)
			.order('applied_date', { ascending: false });

		if (error) {
			console.error('Kunde inte hämta jobbansökningar: ', error.message);
			setMessage(`Kunde inte hämta jobbansökningar: ${error.message}`);
			setLoading(false);
			return;
		}

		const mappedJobs: JobApplication[] = (data ?? []).map((job) => ({
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

		setJobs(mappedJobs);
		setLoading(false);
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

		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			setMessage(
				editingJobId
					? 'Du måste vara inloggad för att kunna redigera ett jobb.'
					: 'Du måste vara inloggad för att kunna lägga till ett jobb.',
			);
			return;
		}

		if (!form.companyName.trim() || !form.jobTitle.trim()) {
			setMessage('Företag och jobbtitel måste fyllas i.');
			return;
		}

		const jobData = {
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

		const { error } = editingJobId
			? await supabase
					.from('job_applications')
					.update(jobData)
					.eq('id', editingJobId)
					.eq('user_id', session.user.id)
			: await supabase.from('job_applications').insert({
					...jobData,
					user_id: session.user.id,
				});

		if (error) {
			console.error(
				editingJobId
					? 'Kunde inte uppdatera jobbet: '
					: 'Kunde inte lägga till jobbet: ',
				error.message,
			);
			setMessage(
				`${editingJobId ? 'Kunde inte uppdatera jobbet' : 'Kunde inte lägga till jobbet'} : ${error.message}`,
			);
			return;
		}

		setForm(emptyForm);
		setEditingJobId(null);
		setMessage(
			editingJobId ? 'Jobbet har uppdaterats' : 'Jobbet har lagts till',
		);

		await fetchJobs();
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

		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			setMessage(
				'Du måste vara inloggad för att kunna ta bort ett jobb.',
			);
			return;
		}

		const { error } = await supabase
			.from('job_applications')
			.delete()
			.eq('id', job.id)
			.eq('user_id', session.user.id);

		if (error) {
			console.error('Kunde inte ta bort jobbet: ', error.message);
			setMessage(`Kunde inte ta bort jobbet: ${error.message}`);
			return;
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
			<section className='card jobs-form-card'>
				<div className='jobs-page-header'>
					<p className='jobs-eyebrow'>Jobbspårning</p>
					<h1>Sökta Jobb</h1>

					<p className='jobs-page-description'>
						Lägg till, följ upp och filtrera dina jobbansökningar.
					</p>
				</div>

				<div className='jobs-count'>
					<strong>{jobs.length}</strong>
					<span>jobb</span>
				</div>

				<form className='jobs-form' onSubmit={handleSubmit}>
					<label>
						Företag
						<input
							type='text'
							value={form.companyName}
							onChange={(e) =>
								updateForm('companyName', e.target.value)
							}
							required
						/>
					</label>

					<label>
						Jobbtitel
						<input
							type='text'
							value={form.jobTitle}
							onChange={(e) =>
								updateForm('jobTitle', e.target.value)
							}
							required
						/>
					</label>

					<label>
						Plats
						<input
							type='text'
							value={form.location}
							onChange={(e) =>
								updateForm('location', e.target.value)
							}
						/>
					</label>

					<label>
						Länk till annons
						<input
							type='url'
							value={form.jobUrl}
							onChange={(e) =>
								updateForm('jobUrl', e.target.value)
							}
						/>
					</label>

					<label>
						Status
						<select
							value={form.status}
							onChange={(e) =>
								updateForm(
									'status',
									e.target.value as JobStatus,
								)
							}
						>
							{jobStatusOptions.map((status) => (
								<option key={status} value={status}>
									{jobStatusLabels[status]}
								</option>
							))}
						</select>
					</label>

					<label>
						Ansökningsdatum
						<input
							type='date'
							value={form.appliedDate}
							onChange={(e) =>
								updateForm('appliedDate', e.target.value)
							}
						/>
					</label>

					<label>
						Sista Ansökningsdag
						<input
							type='date'
							value={form.applicationDeadline}
							onChange={(e) =>
								updateForm(
									'applicationDeadline',
									e.target.value,
								)
							}
						/>
					</label>

					<label>
						Anteckningar
						<textarea
							value={form.notes}
							onChange={(e) =>
								updateForm('notes', e.target.value)
							}
						/>
					</label>

					<div className='jobs-form-actions'>
						<button className='jobs-submit-button' type='submit'>
							{editingJobId
								? 'Spara ändringar'
								: 'Lägg till jobb'}
						</button>

						{editingJobId && (
							<button
								className='jobs-cancel-button'
								type='button'
								onClick={handleCancelEdit}
							>
								Avbryt
							</button>
						)}
					</div>
				</form>

				{message && <p>{message}</p>}
			</section>

			<section className='card jobs-table-card'>
				<div className='jobs-table-header'>
					<div>
						<p className='jobs-eyebrow'>Översikt</p>
						<h2>Jobbansökningar</h2>
					</div>

					<label>
						Filtrera Status
						<select
							value={statusFilter}
							onChange={(e) =>
								setStatusFilter(
									e.target.value as JobStatus | 'all',
								)
							}
						>
							<option value='all'>Alla</option>

							{jobStatusOptions.map((status) => (
								<option key={status} value={status}>
									{jobStatusLabels[status]}
								</option>
							))}
						</select>
					</label>
				</div>

				{loading ? (
					<p>Laddar jobbansökningar...</p>
				) : filteredJobs.length === 0 ? (
					<p>Inga jobbansökningar hittades.</p>
				) : (
					<div className='jobs-list'>
						{filteredJobs.map((job) => (
							<article className='job-card' key={job.id}>
								<div className='job-card-header'>
									<div>
										<p className='job-card-company'>
											{job.companyName}
										</p>

										<h3>{job.jobTitle}</h3>
									</div>

									<span
										className={`job-status job-status--${job.status}`}
									>
										{jobStatusLabels[job.status]}
									</span>
								</div>

								<dl className='job-card-details'>
									<div>
										<dt>Ansökt</dt>
										<dd>{job.appliedDate || '-'}</dd>
									</div>

									<div>
										<dt>Deadline</dt>
										<dd>
											{job.applicationDeadline || '-'}
										</dd>
									</div>

									<div>
										<dt>Plats</dt>
										<dd>{job.location || '-'}</dd>
									</div>
								</dl>

								{job.notes && (
									<p className='job-card-notes'>
										{job.notes}
									</p>
								)}

								<div className='job-card-footer'>
									{job.jobUrl ? (
										<a
											className='job-link'
											href={job.jobUrl}
											target='_blank'
											rel='noreferrer'
										>
											Öppna annons
										</a>
									) : (
										<span className='job-card-no-link'>
											Ingen annonslänk
										</span>
									)}

									<div className='job-row-actions'>
										<button
											className='job-action-button job-action-button--edit'
											type='button'
											onClick={() => handleEdit(job)}
										>
											Redigera
										</button>

										<button
											className='job-action-button job-action-button--delete'
											type='button'
											onClick={() =>
												void handleDelete(job)
											}
										>
											Ta bort
										</button>
									</div>
								</div>
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
