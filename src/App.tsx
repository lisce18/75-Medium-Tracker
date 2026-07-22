import type { DailyLog } from './types/DailyLog';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tracker-logs';
const initialLog: DailyLog = {
	date: new Date().toISOString().split('T')[0],
	morningWeight: 0,
	nightWeight: 0,
	sleepHours: 0,
	energy: 5,
	numberMeals: 0,
	waterLiters: 0,
	movementDone: false,
	productivityDone: false,
	snacksControlled: false,
	supplementsMorning: false,
	supplementsNight: false,
	notes: '',
};

type LogsByDate = Record<string, DailyLog>;

function App() {
	const [logsByDate, setLogsByDate] = useState<LogsByDate>(() => {
		const savedLogs = localStorage.getItem(STORAGE_KEY);
		if (!savedLogs) {
			return {
				[initialLog.date]: initialLog,
			};
		}

		return JSON.parse(savedLogs) as LogsByDate;
	});

	const todaysLog = logsByDate[initialLog.date] ?? initialLog;

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(logsByDate));
	}, [logsByDate]);

	function updateLog<K extends keyof DailyLog>(key: K, value: DailyLog[K]) {
		setLogsByDate((currentLogs) => {
			const currentLog = currentLogs[initialLog.date] ?? initialLog;

			return {
				...currentLogs,
				[initialLog.date]: {
					...currentLog,
					[key]: value,
				},
			};
		});
	}

	function resetToday() {
		setLogsByDate((currentLogs) => ({
			...currentLogs,
			[initialLog.date]: initialLog,
		}));
	}

	const sortedLogs = Object.values(logsByDate).sort((a, b) =>
		b.date.localeCompare(a.date),
	);

	function formatLogKey(key: string) {
		const labels: Record<string, string> = {
			date: 'Datum',
			morningWeight: 'Morgonvikt',
			nightWeight: 'Kvällsvikt',
			sleepHours: 'Sömn',
			energy: 'Energi',
			numberMeals: 'Antal måltider',
			waterLiters: 'Vatten',
			movementDone: 'Rörelse',
			productivityDone: 'Produktivitet',
			snacksControlled: 'Snacks',
			supplementsMorning: 'Tillskott Morgon',
			supplementsNight: 'Tillskott Kväll',
			notes: 'Kommentar',
		};

		return labels[key] ?? key;
	}

	function formatLogValue(key: string, value: unknown): string {
		if (typeof value === 'boolean') {
			return value ? 'Ja' : 'Nej';
		}

		if (value === undefined || value === null || value === '') {
			return 'Ej Loggat';
		}

		if (key === 'morningWeight' || key === 'nightWeight') {
			return `${value} kg`;
		}

		if (key === 'sleepHours') {
			return `${value} h`;
		}

		if (key === 'waterLiters') {
			return `${value} L`;
		}

		if (key === 'energy') {
			return `${value}/10`;
		}

		if (key === 'numberMeals') {
			return `${value} st`;
		}

		if (key === 'supplementsMorning' || key === 'supplementsNight') {
			return value ? 'Ja' : 'Nej';
		}

		if (
			key === 'productivityDone' ||
			key === 'movementDone' ||
			key === 'snacksControlled'
		) {
			return value ? 'Ja' : 'Nej';
		}

		if (key === 'notes') {
			return value ? String(value) : 'Ingen Kommentar';
		}

		return String(value);
	}

	return (
		<main>
			<h1>75 Medium Tracker</h1>

			<section className='card'>
				<h2>Dagens logg</h2>
				<p className='card-date'>Datum: {todaysLog.date}</p>

				<div className='stats-grid'>
					<div className='stat-card'>
						<p className='stat-label'>Antal Måltider</p>
						<p className='stat-value'>{todaysLog.numberMeals} st</p>
					</div>

					<div className='stat-card'>
						<p className='stat-label'>Morgon Vikt</p>
						<p className='stat-value'>
							{todaysLog.morningWeight} kg
						</p>
					</div>

					<div className='stat-card'>
						<p className='stat-label'>Kvälls Vikt</p>
						<p className='stat-value'>{todaysLog.nightWeight} kg</p>
					</div>

					<div className='stat-card'>
						<p className='stat-label'>Vatten</p>
						<p className='stat-value'>{todaysLog.waterLiters} L</p>
					</div>

					<div className='stat-card'>
						<p className='stat-label'>Sömn</p>
						<p className='stat-value'>{todaysLog.sleepHours} h</p>
					</div>

					<div className='stat-card'>
						<p className='stat-label'>Energi</p>
						<p className='stat-value'>{todaysLog.energy}/10</p>
					</div>

					<div className='stat-card'>
						<p className='stat-label'>Rörelse</p>
						<p className='stat-value'>
							{todaysLog.movementDone ? 'Klar' : 'Ej klar'}
						</p>
					</div>

					<div className='stat-card'>
						<p className='stat-label'>Produktivitet</p>
						<p className='stat-value'>
							{todaysLog.productivityDone ? 'Klar' : 'Ej klar'}
						</p>
					</div>

					<div className='stat-card'>
						<p className='stat-label'>Snacks</p>
						<p className='stat-value'>
							{todaysLog.snacksControlled
								? 'Kontrollerat'
								: 'Ej loggat'}
						</p>
					</div>

					<div className='stat-card'>
						<p className='stat-label'>Tillskott Morgon</p>
						<p className='stat-value'>
							{todaysLog.supplementsMorning
								? 'Klara'
								: 'Ej klara'}
						</p>
					</div>
					<div className='stat-card'>
						<p className='stat-label'>Tillskott Kväll</p>
						<p className='stat-value'>
							{todaysLog.supplementsNight ? 'Klara' : 'Ej klara'}
						</p>
					</div>
				</div>
			</section>

			<section className='card form-card'>
				<h2> Uppdatera dagen</h2>

				<form className='log-form'>
					<label>
						Måltider
						<input
							type='number'
							min='0'
							max='3'
							value={
								todaysLog.numberMeals === 0
									? ''
									: todaysLog.numberMeals
							}
							onChange={(e) =>
								updateLog('numberMeals', Number(e.target.value))
							}
						/>
					</label>

					<label>
						Morgon Vikt, kg
						<input
							type='number'
							min='0'
							step='0.1'
							value={
								todaysLog.morningWeight === 0
									? ''
									: todaysLog.morningWeight
							}
							onChange={(e) =>
								updateLog(
									'morningWeight',
									Number(e.target.value),
								)
							}
						/>
					</label>

					<label>
						Kvälls Vikt, kg
						<input
							type='number'
							min='0'
							step='0.1'
							value={
								todaysLog.nightWeight === 0
									? ''
									: todaysLog.nightWeight
							}
							onChange={(e) =>
								updateLog('nightWeight', Number(e.target.value))
							}
						/>
					</label>

					<label>
						Vatten, liter
						<input
							type='number'
							min='0'
							step='0.1'
							value={
								todaysLog.waterLiters === 0
									? ''
									: todaysLog.waterLiters
							}
							onChange={(e) =>
								updateLog('waterLiters', Number(e.target.value))
							}
						/>
					</label>

					<label>
						Sömn, timmar
						<input
							type='number'
							min='0'
							step='0.25'
							value={
								todaysLog.sleepHours === 0
									? ''
									: todaysLog.sleepHours
							}
							onChange={(e) =>
								updateLog('sleepHours', Number(e.target.value))
							}
						/>
					</label>

					<label>
						Energi, 1-10
						<input
							type='number'
							min='1'
							max='10'
							value={todaysLog.energy}
							onChange={(e) =>
								updateLog('energy', Number(e.target.value))
							}
						/>
						<span>{todaysLog.energy}/10</span>
					</label>

					<label className='checkbox-label'>
						Rörelse
						<input
							type='checkbox'
							checked={todaysLog.movementDone}
							onChange={(e) =>
								updateLog('movementDone', e.target.checked)
							}
						/>
					</label>

					<label className='checkbox-label'>
						Produktivitet
						<input
							type='checkbox'
							checked={todaysLog.productivityDone}
							onChange={(e) =>
								updateLog('productivityDone', e.target.checked)
							}
						/>
					</label>

					<label className='checkbox-label'>
						Snacks
						<input
							type='checkbox'
							checked={todaysLog.snacksControlled}
							onChange={(e) =>
								updateLog('snacksControlled', e.target.checked)
							}
						/>
					</label>

					<label className='checkbox-label'>
						Morgontillskott
						<input
							type='checkbox'
							checked={todaysLog.supplementsMorning}
							onChange={(e) =>
								updateLog(
									'supplementsMorning',
									e.target.checked,
								)
							}
						/>
					</label>

					<label className='checkbox-label'>
						Kvällstillskott
						<input
							type='checkbox'
							checked={todaysLog.supplementsNight}
							onChange={(e) =>
								updateLog('supplementsNight', e.target.checked)
							}
						/>
					</label>
				</form>
			</section>

			<section className='card history-card'>
				<div className='section-header'>
					<h2>Historik</h2>
					<button type='button' onClick={resetToday}>
						Nollställ idag
					</button>
				</div>

				<div className='history-list'>
					{sortedLogs.map((log) => (
						<details className='history-item' key={log.date}>
							<summary className='history-summary'>
								<span className='history-date'>{log.date}</span>

								<span className='history-preview'>
									{' '}
									{log.numberMeals} måltider ·{' '}
									{log.waterLiters} L · {log.sleepHours} h
									sömn
								</span>
							</summary>

							<dl className='history-details'>
								{Object.entries(log).map(([key, value]) => (
									<div className='history-detail' key={key}>
										<dt>{formatLogKey(key)}</dt>
										<dd>{formatLogValue(key, value)}</dd>
									</div>
								))}
							</dl>
						</details>
					))}
				</div>
			</section>
		</main>
	);
}

export default App;
