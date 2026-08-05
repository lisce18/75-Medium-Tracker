import type { SubmitEventHandler } from 'react';
import { jobStatusLabels, jobStatusOptions } from '../../constants/jobStatuses';
import type {
	JobApplicationForm,
	JobStatus,
} from '../../types/JobApplications';

type JobFormProps = {
	form: JobApplicationForm;
	editingJobId: number | null;
	jobsCount: number;
	message: string;
	isSaving: boolean;
	onSubmit: SubmitEventHandler<HTMLFormElement>;
	onChange: <K extends keyof JobApplicationForm>(
		key: K,
		value: JobApplicationForm[K],
	) => void;
	onCancelEdit: () => void;
};

export default function JobForm({
	form,
	editingJobId,
	jobsCount,
	message,
	isSaving,
	onSubmit,
	onChange,
	onCancelEdit,
}: JobFormProps) {
	return (
		<section className='card jobs-form-card'>
			<div className='jobs-page-header'>
				<p className='jobs-eyebrow'>Jobbspårning</p>
				<h1>Sökta Jobb</h1>

				<p className='jobs-page-description'>
					Lägg till, följ upp och filtrera dina jobbansökningar.
				</p>
			</div>

			<div className='jobs-count'>
				<strong>{jobsCount}</strong>
				<span>jobb</span>
			</div>

			<form
				className='jobs-form'
				onSubmit={onSubmit}
				aria-busy={isSaving}
			>
				<label>
					Företag
					<input
						type='text'
						value={form.companyName}
						onChange={(e) =>
							onChange('companyName', e.target.value)
						}
						required
					/>
				</label>

				<label>
					Jobbtitel
					<input
						type='text'
						value={form.jobTitle}
						onChange={(e) => onChange('jobTitle', e.target.value)}
						required
					/>
				</label>

				<label>
					Plats
					<input
						type='text'
						value={form.location}
						onChange={(e) => onChange('location', e.target.value)}
					/>
				</label>

				<label>
					Länk till annons
					<input
						type='url'
						value={form.jobUrl}
						onChange={(e) => onChange('jobUrl', e.target.value)}
					/>
				</label>

				<label>
					Status
					<select
						value={form.status}
						onChange={(e) =>
							onChange('status', e.target.value as JobStatus)
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
							onChange('appliedDate', e.target.value)
						}
					/>
				</label>

				<label>
					Sista Ansökningsdag
					<input
						type='date'
						value={form.applicationDeadline}
						onChange={(e) =>
							onChange('applicationDeadline', e.target.value)
						}
					/>
				</label>

				<label>
					Anteckningar
					<textarea
						value={form.notes}
						onChange={(e) => onChange('notes', e.target.value)}
					/>
				</label>

				<div className='jobs-form-actions'>
					<button
						className='jobs-submit-button'
						type='submit'
						disabled={isSaving}
					>
						{isSaving
							? editingJobId !== null
								? 'Sparar ändringar...'
								: 'Lägger till jobb...'
							: editingJobId !== null
								? 'Spara ändringar'
								: 'Lägg till jobb'}
					</button>

					{editingJobId && (
						<button
							className='jobs-cancel-button'
							type='button'
							onClick={onCancelEdit}
							disabled={isSaving}
						>
							Avbryt
						</button>
					)}
				</div>
			</form>

			{message && <p aria-live='polite'>{message}</p>}
		</section>
	);
}
