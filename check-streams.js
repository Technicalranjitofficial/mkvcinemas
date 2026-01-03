
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const movie = await prisma.movie.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    console.log('Latest Movie:', movie ? movie.title : 'None');
    console.log('Stream Links:', movie ? JSON.stringify(movie.streamLinks, null, 2) : 'None');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
