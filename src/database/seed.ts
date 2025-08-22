import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professional, TravelMode } from '../professionals/entities/professional.entity';
import { Client } from '../clients/entities/client.entity';
import { Availability } from '../availabilities/entities/availability.entity';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🌱 Starting database seeding...');

    // Get repositories
    const professionalRepo = app.get<Repository<Professional>>(
      getRepositoryToken(Professional),
    );
    const clientRepo = app.get<Repository<Client>>(
      getRepositoryToken(Client),
    );
    const availabilityRepo = app.get<Repository<Availability>>(
      getRepositoryToken(Availability),
    );

    // Clear existing data
    await availabilityRepo.clear();
    await clientRepo.clear();
    await professionalRepo.clear();

    console.log('🧹 Cleared existing data');

    // Create professionals
    const professionals: Professional[] = [
      {
        id: uuidv4(),
        name: 'John Doe',
        email: 'john.doe@cleaning.com',
        category: 'cleaning',
        hourlyRateCents: 5000, // $50/hour
        travelMode: TravelMode.LOCAL,
        locationLat: 40.7128,
        locationLng: -74.0060,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        availabilities: [],
        bookings: [],
      },
      {
        id: uuidv4(),
        name: 'Jane Smith',
        email: 'jane.smith@plumbing.com',
        category: 'plumbing',
        hourlyRateCents: 7500, // $75/hour
        travelMode: TravelMode.TRAVEL,
        locationLat: 40.7589,
        locationLng: -73.9851,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        availabilities: [],
        bookings: [],
      },
      {
        id: uuidv4(),
        name: 'Mike Johnson',
        email: 'mike.johnson@electrical.com',
        category: 'electrical',
        hourlyRateCents: 8000, // $80/hour
        travelMode: TravelMode.LOCAL,
        locationLat: 40.7505,
        locationLng: -73.9934,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        availabilities: [],
        bookings: [],
      },
      {
        id: uuidv4(),
        name: 'Sarah Wilson',
        email: 'sarah.wilson@cleaning.com',
        category: 'cleaning',
        hourlyRateCents: 4500, // $45/hour
        travelMode: TravelMode.LOCAL,
        locationLat: 40.7648,
        locationLng: -73.9808,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        availabilities: [],
        bookings: [],
      },
    ];

    const savedProfessionals = await professionalRepo.save(professionals);
    console.log(`👷 Created ${savedProfessionals.length} professionals`);

    // Create clients
    const clients: Client[] = [
      {
        id: uuidv4(),
        name: 'Alice Brown',
        email: 'alice.brown@email.com',
        phone: '+1-555-0101',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        bookings: [],
      },
      {
        id: uuidv4(),
        name: 'Bob Davis',
        email: 'bob.davis@email.com',
        phone: '+1-555-0102',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        bookings: [],
      },
      {
        id: uuidv4(),
        name: 'Carol Evans',
        email: 'carol.evans@email.com',
        phone: '+1-555-0103',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        bookings: [],
      },
    ];

    const savedClients = await clientRepo.save(clients);
    console.log(`👥 Created ${savedClients.length} clients`);

    // Create availabilities for each professional
    const availabilities: Availability[] = [];
    
    savedProfessionals.forEach((professional) => {
      // Monday to Friday, 9 AM to 5 PM
      for (let day = 1; day <= 5; day++) {
        availabilities.push({
          id: uuidv4(),
          professionalId: professional.id,
          dayOfWeek: day,
          startTime: '09:00:00',
          endTime: '17:00:00',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          professional: professional,
        });
      }
    });

    const savedAvailabilities = await availabilityRepo.save(availabilities);
    console.log(`📅 Created ${savedAvailabilities.length} availability windows`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Sample data created:');
    console.log(`   - ${savedProfessionals.length} professionals`);
    console.log(`   - ${savedClients.length} clients`);
    console.log(`   - ${savedAvailabilities.length} availability windows`);
    
    console.log('\n🔑 Sample professional IDs for testing:');
    savedProfessionals.forEach((prof, index) => {
      console.log(`   ${index + 1}. ${prof.name} (${prof.category}): ${prof.id}`);
    });
    
    console.log('\n🔑 Sample client IDs for testing:');
    savedClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.name}: ${client.id}`);
    });

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed()
  .then(() => {
    console.log('\n✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding process failed:', error);
    process.exit(1);
  });
