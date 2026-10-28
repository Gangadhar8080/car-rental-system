// Run with: npm run seed
// Creates demo admin/manager/user accounts and a handful of cars.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Car = require('./models/Car');
const Booking = require('./models/Booking');
const Maintenance = require('./models/Maintenance');

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Car.deleteMany({}),
    Booking.deleteMany({}),
    Maintenance.deleteMany({}),
  ]);

  console.log('Creating users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@carrental.com',
    phone: '9999999999',
    password: 'Admin@123',
    drivingLicenseNumber: 'ADM-0001',
    role: 'admin',
  });

  const manager = await User.create({
    name: 'Fleet Manager',
    email: 'manager@carrental.com',
    phone: '8888888888',
    password: 'Manager@123',
    drivingLicenseNumber: 'MGR-0001',
    role: 'manager',
  });

  const demoUser = await User.create({
    name: 'Demo User',
    email: 'user@carrental.com',
    phone: '7777777777',
    password: 'User@123',
    drivingLicenseNumber: 'DL-12345678',
    role: 'user',
  });

  console.log('Creating cars...');
  const cars = await Car.insertMany([
    {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      pricePerDay: 2500,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      seats: 5,
      mileage: '18 km/l',
      location: 'Bangalore',
      description: 'A reliable, fuel-efficient sedan perfect for city driving and highway trips.',
      features: ['Air Conditioning', 'Bluetooth', 'GPS', 'USB Charging', 'Automatic Transmission'],
      images: ['https://images.unsplash.com/photo-1623869675184-3e15e50a3c9e?w=800'],
      status: 'Available',
      createdBy: admin._id,
    },
    {
      brand: 'Hyundai',
      model: 'Creta',
      year: 2023,
      pricePerDay: 3200,
      fuelType: 'Diesel',
      transmission: 'Automatic',
      seats: 5,
      mileage: '16 km/l',
      location: 'Hyderabad',
      description: 'A spacious SUV with modern features, great for family trips.',
      features: ['Sunroof', 'Air Conditioning', 'Bluetooth', 'GPS', 'Rear Camera'],
      images: ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800'],
      status: 'Available',
      createdBy: admin._id,
    },
    {
      brand: 'Maruti Suzuki',
      model: 'Swift',
      year: 2022,
      pricePerDay: 1600,
      fuelType: 'Petrol',
      transmission: 'Manual',
      seats: 5,
      mileage: '21 km/l',
      location: 'Bangalore',
      description: 'A compact hatchback that is easy to drive and park in the city.',
      features: ['Air Conditioning', 'USB Charging', 'Power Steering'],
      images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800'],
      status: 'Available',
      createdBy: admin._id,
    },
    {
      brand: 'Tata',
      model: 'Nexon EV',
      year: 2024,
      pricePerDay: 3800,
      fuelType: 'Electric',
      transmission: 'Automatic',
      seats: 5,
      mileage: '312 km range',
      location: 'Chennai',
      description: 'An all-electric SUV with zero emissions and a smooth, silent ride.',
      features: ['Fast Charging', 'Touchscreen Infotainment', 'GPS', 'Air Conditioning'],
      images: ['https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800'],
      status: 'Available',
      createdBy: admin._id,
    },
    {
      brand: 'Mahindra',
      model: 'Thar',
      year: 2023,
      pricePerDay: 4200,
      fuelType: 'Diesel',
      transmission: 'Manual',
      seats: 4,
      mileage: '15 km/l',
      location: 'Pune',
      description: 'A rugged off-roader for adventure trips and rough terrain.',
      features: ['4x4 Drive', 'Air Conditioning', 'Convertible Top'],
      images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'],
      status: 'Maintenance',
      createdBy: admin._id,
    },
    {
      brand: 'Honda',
      model: 'City',
      year: 2024,
      pricePerDay: 2800,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      seats: 5,
      mileage: '17 km/l',
      location: 'Mumbai',
      description: 'A premium sedan known for its comfort and smooth ride quality.',
      features: ['Air Conditioning', 'Bluetooth', 'Sunroof', 'Cruise Control'],
      images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800'],
      status: 'Available',
      createdBy: admin._id,
    },
  ]);

  const tharCar = cars.find((c) => c.model === 'Thar');
  await Maintenance.create({
    carId: tharCar._id,
    maintenanceType: 'Service',
    description: 'Routine service and off-road tire replacement',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    cost: 8500,
    status: 'InProgress',
    createdBy: manager._id,
  });

  console.log('\nSeed complete! Demo credentials:');
  console.log('  Admin:   admin@carrental.com   / Admin@123');
  console.log('  Manager: manager@carrental.com / Manager@123');
  console.log('  User:    user@carrental.com    / User@123');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
