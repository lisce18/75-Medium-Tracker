import { jobStatusLabels, jobStatusOptions } from '../../constants/jobStatuses';
import type { JobStatus } from '../../types/JobApplications';

type JobsFilterProps = {
	statusFilter: JobStatus | 'all';
	onStatusFilterChange: (status: JobStatus | 'all') => void;
};

export default function JobsFilter({
	statusFilter,
	onStatusFilterChange,
}: JobsFilterProps) {
	return (
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
						onStatusFilterChange(
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
	);
}
