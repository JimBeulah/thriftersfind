const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateStationCoordinates() {
    try {
        console.log('Updating station coordinates...');

        // Update Montevista Courier Station
        await prisma.station.updateMany({
            where: { name: 'Montevista Courier Station' },
            data: {
                latitude: 7.7000,
                longitude: 126.0833,
            },
        });

        // Update Nabunturan Pickup Point  
        await prisma.station.updateMany({
            where: { name: 'Nabunturan Pickup Point' },
            data: {
                latitude: 7.6167,
                longitude: 125.9667,
            },
        });

        // Update Compostela Courier & Pickup
        await prisma.station.updateMany({
            where: { name: 'Compostela Courier & Pickup' },
            data: {
                latitude: 7.6667,
                longitude: 126.0833,
            },
        });

        console.log('✓ Updated coordinates for all stations successfully!');
    } catch (error) {
        console.error('Error updating station coordinates:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateStationCoordinates()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
