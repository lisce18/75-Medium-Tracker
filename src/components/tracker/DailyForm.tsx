import type { DailyLog } from '../../types/DailyLog';

type DailyFormProps = {
	log: DailyLog;
	onUpdate: <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => void;
	isLoading: boolean;
	message: string;
};

export function DailyForm({
	log,
	onUpdate,
	isLoading,
	message,
}: DailyFormProps) {
	return (
		<section className='card form-card'>
			<div className='form-card-header'>
				<h2>Dagens Logg</h2>

				<div className='form-card-status'>
					{isLoading && (
						<p className='status-message status-message--loading'>
							Laddar loggar...
						</p>
					)}

					{message && (
						<p
							className={`status-message ${
								message.startsWith('Kunde inte')
									? 'status-message--error'
									: message === 'Sparat'
										? 'status-message--success'
										: 'status-message--loading'
							}`}
						>
							{message}
						</p>
					)}
				</div>
			</div>

			<form className='log-form'>
				<label>
					Måltider
					<input
						type='number'
						min='0'
						max='3'
						value={log.numberMeals === 0 ? '' : log.numberMeals}
						onChange={(e) =>
							onUpdate('numberMeals', Number(e.target.value))
						}
					/>
				</label>

				<label>
					Morgon Vikt, kg
					<input
						type='number'
						min='0'
						step='0.1'
						value={log.morningWeight === 0 ? '' : log.morningWeight}
						onChange={(e) =>
							onUpdate('morningWeight', Number(e.target.value))
						}
					/>
				</label>

				<label>
					Kvälls Vikt, kg
					<input
						type='number'
						min='0'
						step='0.1'
						value={log.nightWeight === 0 ? '' : log.nightWeight}
						onChange={(e) =>
							onUpdate('nightWeight', Number(e.target.value))
						}
					/>
				</label>

				<label>
					Vatten, liter
					<input
						type='number'
						min='0'
						step='0.1'
						value={log.waterLiters === 0 ? '' : log.waterLiters}
						onChange={(e) =>
							onUpdate('waterLiters', Number(e.target.value))
						}
					/>
				</label>

				<label>
					Sömn, timmar
					<input
						type='number'
						min='0'
						step='0.25'
						value={log.sleepHours === 0 ? '' : log.sleepHours}
						onChange={(e) =>
							onUpdate('sleepHours', Number(e.target.value))
						}
					/>
				</label>

				<label>
					Energi, 1-10
					<input
						type='number'
						min='1'
						max='10'
						value={log.energy}
						onChange={(e) =>
							onUpdate('energy', Number(e.target.value))
						}
					/>
					<span>{log.energy}/10</span>
				</label>

				<label className='checkbox-label'>
					Rörelse
					<input
						type='checkbox'
						checked={log.movementDone}
						onChange={(e) =>
							onUpdate('movementDone', e.target.checked)
						}
					/>
				</label>

				<label className='checkbox-label'>
					Produktivitet
					<input
						type='checkbox'
						checked={log.productivityDone}
						onChange={(e) =>
							onUpdate('productivityDone', e.target.checked)
						}
					/>
				</label>

				<label className='checkbox-label'>
					Snacks
					<input
						type='checkbox'
						checked={log.snacksControlled}
						onChange={(e) =>
							onUpdate('snacksControlled', e.target.checked)
						}
					/>
				</label>

				<label className='checkbox-label'>
					Morgontillskott
					<input
						type='checkbox'
						checked={log.supplementsMorning}
						onChange={(e) =>
							onUpdate('supplementsMorning', e.target.checked)
						}
					/>
				</label>

				<label className='checkbox-label'>
					Kvällstillskott
					<input
						type='checkbox'
						checked={log.supplementsNight}
						onChange={(e) =>
							onUpdate('supplementsNight', e.target.checked)
						}
					/>
				</label>
			</form>
		</section>
	);
}
