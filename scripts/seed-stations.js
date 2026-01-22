const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedStations() {
    try {
        console.log('Seeding stations...');

        // Check if stations already exist
        const existingStations = await prisma.station.count();

        if (existingStations > 0) {
            console.log(`Found ${existingStations} existing stations. Skipping seed.`);
            return;
        }

        // Create initial stations
        const stations = await prisma.station.createMany({
            data: [
                {
                    id: 'st_montevista_001',
                    name: 'Montevista Courier Station',
                    location: 'Montevista, Davao de Oro',
                    type: 'courier',
                    contactNumber: '+63 912 345 6789',
                    isActive: true,
                },
                {
                    id: 'st_nabunturan_001',
                    name: 'Nabunturan Pickup Point',
                    location: 'Nabunturan, Davao de Oro',
                    type: 'pickup',
                    contactNumber: '+63 912 345 6790',
                    isActive: true,
                },
                {
                    id: 'st_compostela_001',
                    name: 'Compostela Courier & Pickup',
                    location: 'Compostela, Davao de Oro',
                    type: 'courier',
                    contactNumber: '+63 912 345 6791',
                    isActive: true,
                },
            ],
        });

        console.log(`✓ Created ${stations.count} stations successfully!`);
    } catch (error) {
        console.error('Error seeding stations:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedStations()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
