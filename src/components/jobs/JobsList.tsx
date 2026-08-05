import type { JobApplication } from '../../types/JobApplications';
import JobCard from './JobCard';

type JobsListProps = {
	jobs: JobApplication[];
	loading: boolean;
	deletingJobId: number | null;
	onEdit: (job: JobApplication) => void;
	onDelete: (job: JobApplication) => void;
};

export default function JobsList({
	jobs,
	loading,
	deletingJobId,
	onEdit,
	onDelete,
}: JobsListProps) {
	if (loading) {
		return <p>Laddar jobbansökningar...</p>;
	}

	if (jobs.length === 0) {
		return <p>Inga jobbansökningar hittades...</p>;
	}

	return (
		<div className='jobs-list'>
			{jobs.map((job) => (
				<JobCard
					key={job.id}
					job={job}
					isDeleting={deletingJobId === job.id}
					actionsDisabled={deletingJobId !== null}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
