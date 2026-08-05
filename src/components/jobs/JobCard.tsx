import type { JobApplication } from '../../types/JobApplications';
import { jobStatusLabels } from '../../constants/jobStatuses';

type JobCardProps = {
	job: JobApplication;
	isDeleting: boolean;
	actionsDisabled: boolean;
	onEdit: (job: JobApplication) => void;
	onDelete: (job: JobApplication) => void;
};

export default function JobCard({
	job,
	isDeleting,
	actionsDisabled,
	onEdit,
	onDelete,
}: JobCardProps) {
	return (
		<article className='job-card'>
			<div className='job-card-header'>
				<div>
					<p className='job-card-company'>{job.companyName}</p>

					<h3>{job.jobTitle}</h3>
				</div>

				<span className={`job-status job-status--${job.status}`}>
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
					<dd>{job.applicationDeadline || '-'}</dd>
				</div>

				<div>
					<dt>Plats</dt>
					<dd>{job.location || '-'}</dd>
				</div>
			</dl>

			{job.notes && <p className='job-card-notes'>{job.notes}</p>}

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
					<span className='job-card-no-link'>Ingen annonslänk</span>
				)}

				<div className='job-row-actions'>
					<button
						className='job-action-button job-action-button--edit'
						type='button'
						onClick={() => onEdit(job)}
					>
						Redigera
					</button>

					<button
						className='job-action-button job-action-button--delete'
						type='button'
						onClick={() => onDelete(job)}
						disabled={actionsDisabled}
					>
						{isDeleting ? 'Tar bort...' : 'Ta bort'}
					</button>
				</div>
			</div>
		</article>
	);
}
