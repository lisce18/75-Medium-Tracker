import type { SubmitEventHandler } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { DailyLog } from './types/DailyLog';
import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';

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

function App() {
	const [session, setSession] = useState<Session | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
	const [authMessage, setAuthMessage] = useState('');
	const [authLoading, setAuthLoading] = useState(true);
	const [logsByDate, setLogsByDate] = useState<LogsByDate>({
		[initialLog.date]: initialLog,
	});
	const [logsLoading, setLogsLoading] = useState(false);
	const [logsMessage, setLogsMessage] = useState('');

	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const todaysLog = logsByDate[initialLog.date] ?? initialLog;

	useEffect(() => {
		void supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setAuthLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession);
			setAuthLoading(false);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

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

	const handleAuth: SubmitEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		setAuthMessage('');

		const result =
			authMode === 'signIn'
				? await supabase.auth.signInWithPassword({ email, password })
				: await supabase.auth.signUp({ email, password });

		if (result.error) {
			setAuthMessage(result.error.message);
			return;
		}

		if (authMode === 'signUp' && !result.data.session) {
			setAuthMessage(
				'Kontot skapades. Kontrollera din e-post för att bekräfta konto.',
			);
			return;
		}

		setAuthMessage('');
	};

	async function handleSignOut() {
		const { error } = await supabase.auth.signOut();

		if (error) {
			setAuthMessage(error.message);
		}
	}

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

	async function updateLog<K extends keyof DailyLog>(
		key: K,
		value: DailyLog[K],
	) {
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

	if (authLoading) {
		return (
			<main>
				<section className='card'>
					<h2>Laddar...</h2>
				</section>
			</main>
		);
	}

	if (!session) {
		return (
			<main>
				<h1>75 Medium Tracker</h1>

				<section className='card form-card'>
					<h2>
						{authMode === 'signIn' ? 'Logga In' : 'Skapa konto'}
					</h2>

					<form className='log-form' onSubmit={handleAuth}>
						<label>
							E-post
							<input
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete='email'
								required
							/>
						</label>

						<label>
							Lösenord
							<input
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete={
									authMode === 'signIn'
										? 'current-password'
										: 'new-password'
								}
								minLength={6}
								required
							/>
						</label>

						<button
							className='auth-button auth-button-primary'
							type='submit'
						>
							{authMode === 'signIn' ? 'Logga In' : 'Skapa konto'}
						</button>
					</form>

					{authMessage && <p>{authMessage}</p>}

					<button
						className='auth-button auth-button-secondary'
						type='button'
						onClick={() => {
							setAuthMode((currentMode) =>
								currentMode === 'signIn' ? 'signUp' : 'signIn',
							);
							setAuthMessage('');
						}}
					>
						{authMode === 'signIn'
							? 'Har du inget konto? Skapa ett!'
							: 'Har du redan ett konto? Logga in!'}
					</button>
				</section>
			</main>
		);
	}

	return (
		<main>
			<div className='auth-header'>
				<h1>75 Medium Tracker</h1>

				<button
					className='auth-button auth-button-logout'
					type='button'
					onClick={handleSignOut}
				>
					Logga Ut
				</button>
			</div>

			{logsLoading && <p>Laddar loggar...</p>}
			{logsMessage && <p>{logsMessage}</p>}

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
