import type { Session } from '@supabase/supabase-js';
import type { DailyLog } from '../types/DailyLog';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DailyForm } from '../components/tracker/DailyForm';

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
};

type LogsByDate = Record<string, DailyLog>;

type TrackerPageProps = {
	session: Session;
};

function TrackerPage({ session }: TrackerPageProps) {
	const [logsByDate, setLogsByDate] = useState<LogsByDate>({
		[initialLog.date]: initialLog,
	});
	const [logsLoading, setLogsLoading] = useState(false);
	const [logsMessage, setLogsMessage] = useState('');

	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const todaysLog = logsByDate[initialLog.date] ?? initialLog;

	useEffect(() => {
		if (!session) {
			setLogsByDate({
				[initialLog.date]: initialLog,
			});
			return;
		}

		const userId = session.user.id;

		async function fetchLogs() {
			setLogsLoading(true);
			setLogsMessage('');

			const { data, error } = await supabase
				.from('daily_logs')
				.select('*')
				.eq('user_id', userId)
				.order('log_date', { ascending: false });

			if (error) {
				console.error('Kunde inte hämta loggar: ', error.message);
				setLogsMessage(`Kunde inte hämta loggar: ${error.message}`);
				setLogsLoading(false);
				return;
			}

			const fetchedLogs = (data ?? []).reduce<LogsByDate>((logs, row) => {
				const log: DailyLog = {
					date: row.log_date,
					morningWeight: Number(row.morning_weight),
					nightWeight: Number(row.night_weight),
					sleepHours: Number(row.sleep_hours),
					energy: Number(row.energy),
					numberMeals: Number(row.number_meals),
					waterLiters: Number(row.water_liters),
					movementDone: row.movement_done,
					productivityDone: row.productivity_done,
					snacksControlled: row.snacks_controlled,
					supplementsMorning: row.supplements_morning,
					supplementsNight: row.supplements_night,
				};

				logs[log.date] = log;

				return logs;
			}, {});

			setLogsByDate({
				...fetchedLogs,
				[initialLog.date]: fetchedLogs[initialLog.date] ?? initialLog,
			});

			setLogsLoading(false);
		}

		void fetchLogs();
	}, [session]);

	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	async function saveLog(log: DailyLog, userId: string) {
		setLogsMessage('Sparar...');

		const { error } = await supabase.from('daily_logs').upsert(
			{
				user_id: userId,
				log_date: log.date,
				morning_weight: log.morningWeight,
				night_weight: log.nightWeight,
				sleep_hours: log.sleepHours,
				energy: log.energy,
				number_meals: log.numberMeals,
				water_liters: log.waterLiters,
				movement_done: log.movementDone,
				productivity_done: log.productivityDone,
				snacks_controlled: log.snacksControlled,
				supplements_morning: log.supplementsMorning,
				supplements_night: log.supplementsNight,
				updated_at: new Date().toISOString(),
			},
			{
				onConflict: 'user_id,log_date',
			},
		);

		if (error) {
			console.error('Kunde inte spara dagens logg: ', error.message);
			setLogsMessage(`Kunde inte spara loggen: ${error.message}`);
			return;
		}

		setLogsMessage('Sparat');
	}

	function updateLog<K extends keyof DailyLog>(key: K, value: DailyLog[K]) {
		if (!session) return;

		const userId = session.user.id;
		const currentLog = logsByDate[initialLog.date] ?? initialLog;

		const updatedLog: DailyLog = {
			...currentLog,
			[key]: value,
		};

		setLogsByDate((currentLogs) => ({
			...currentLogs,
			[initialLog.date]: updatedLog,
		}));

		setLogsMessage('Väntar på fler ändringar...');

		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		saveTimeoutRef.current = setTimeout(() => {
			void saveLog(updatedLog, userId);
			saveTimeoutRef.current = null;
		}, 700);
	}

	async function resetToday() {
		if (!session) return;

		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
			saveTimeoutRef.current = null;
		}

		setLogsMessage('Sparar...');

		setLogsByDate((currentLogs) => ({
			...currentLogs,
			[initialLog.date]: initialLog,
		}));

		await saveLog(initialLog, session.user.id);
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

		return String(value);
	}

	return (
		<>
			<DailyForm
				log={todaysLog}
				onUpdate={updateLog}
				isLoading={logsLoading}
				message={logsMessage}
			/>

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
		</>
	);
}

export default TrackerPage;
