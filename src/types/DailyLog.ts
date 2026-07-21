export type DailyLog = {
	date: string;
	morningWeight: number;
	nightWeight: number;
	sleepHours: number;
	energy: number;
	numberMeals: number;
	waterLiters: number;
	movementDone: boolean;
	productivityDone: boolean;
	snacksControlled: boolean;
	supplementsMorning: boolean;
	supplementsNight: boolean;
	notes?: string;
};
