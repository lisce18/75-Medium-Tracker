import type { SubmitEventHandler } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import JobsPage from './pages/JobsPage';
import TrackerPage from './pages/TrackerPage';

function App() {
	const [session, setSession] = useState<Session | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');
	const [authMessage, setAuthMessage] = useState('');
	const [authLoading, setAuthLoading] = useState(true);

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

			<nav className='app-nav' aria-label='Huvudnavigering'>
				<NavLink
					to='/'
					end
					className={({ isActive }) =>
						isActive ? 'app-nav-link active' : 'app-nav-link'
					}
				>
					Tracker
				</NavLink>

				<NavLink
					to='/jobs'
					className={({ isActive }) =>
						isActive ? 'app-nav-link active' : 'app-nav-link'
					}
				>
					Sökta Jobb
				</NavLink>
			</nav>

			<Routes>
				<Route path='/' element={<TrackerPage session={session} />} />
				<Route path='/jobs' element={<JobsPage />} />
				<Route path='*' element={<Navigate to='/' replace />} />
			</Routes>
		</main>
	);
}

export default App;
