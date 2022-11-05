module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleFileExtensions: ["js", "ts", "tsx"],
	transform: {
		"^.+\\.(ts|tsx)$": "ts-jest",
	},
	testMatch: [
		"**/tests/**/*.spec.ts",
		"**/tests/**/*.test.ts",
	],	
};