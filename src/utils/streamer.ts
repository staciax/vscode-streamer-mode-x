import find from 'find-process';

const STREAMING_APPS = [
    'obs',
    'streamlabs',
    'xsplit',
    // add more as needed, must be in lowercase
];

export async function detectStreamingApps(
    additionalApps: string[] = [],
): Promise<boolean> {
    const allApps = [
        ...STREAMING_APPS,
        ...additionalApps.map((app) => app.toLowerCase()),
    ];
    try {
        const processes = await find('name', '');

        return processes.some((proc) =>
            allApps.some((app) => proc.name.toLowerCase().includes(app)),
        );
    } catch (error) {
        console.log(`Failed to detect streaming apps: ${error}`);
        return false;
    }
}
