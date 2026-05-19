// Fix database script: Ensure Nick Joseph's data is correct and all users have hashed passwords
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing ORRA database data...\n');

  // 1. Fix Nick Joseph's data
  console.log('👤 Fixing Nick Joseph (nick@orra.app)...');
  const nick = await prisma.user.findUnique({ where: { email: 'nick@orra.app' } });
  
  if (nick) {
    const updatedNick = await prisma.user.update({
      where: { email: 'nick@orra.app' },
      data: {
        location: 'New Orleans, LA',
        profileSetupComplete: true,
        verified: true,
        avatar: '/images/nick-avatar.png',
      },
    });
    console.log('✅ Nick Joseph updated:');
    console.log(`   location: ${updatedNick.location}`);
    console.log(`   profileSetupComplete: ${updatedNick.profileSetupComplete}`);
    console.log(`   verified: ${updatedNick.verified}`);
    console.log(`   avatar: ${updatedNick.avatar}\n`);
  } else {
    console.log('⚠️  Nick Joseph not found! Creating...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    await prisma.user.create({
      data: {
        id: 'user-me',
        email: 'nick@orra.app',
        name: 'Nick Joseph',
        handle: '@nickjoseph',
        password: hashedPassword,
        avatar: '/images/nick-avatar.png',
        coverImage: '/images/profile-cover.png',
        bio: 'CEO & Founder of ORRA | Building the future of social media | Visionary leader',
        location: 'New Orleans, LA',
        website: 'orra.link/nickjoseph',
        auraTokens: 50000,
        auraLevel: 99,
        verified: true,
        online: true,
        badges: JSON.stringify(['Founder', 'CEO', 'Visionary', 'Early Adopter', 'Top Creator']),
        profileSetupComplete: true,
      },
    });
    console.log('✅ Nick Joseph created with correct data\n');
  }

  // 2. Ensure all users have properly hashed passwords
  console.log('🔑 Checking all users have properly hashed passwords...');
  const allUsers = await prisma.user.findMany();
  let fixedCount = 0;
  
  for (const user of allUsers) {
    // Check if the password is a valid bcrypt hash
    const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    
    if (!isBcryptHash) {
      console.log(`   ⚠️  ${user.email} has unhashed password, fixing...`);
      const hashedPassword = await bcrypt.hash('password123', 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      fixedCount++;
    } else {
      // Verify the password works with bcrypt
      const isValid = await bcrypt.compare('password123', user.password);
      if (!isValid) {
        console.log(`   ⚠️  ${user.email} password doesn't match 'password123', rehashing...`);
        const hashedPassword = await bcrypt.hash('password123', 12);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        fixedCount++;
      }
    }
  }
  
  console.log(`✅ Checked ${allUsers.length} users, fixed ${fixedCount} passwords\n`);

  // 3. Also ensure profileSetupComplete is true for all existing demo users
  console.log('📋 Ensuring all demo users have profileSetupComplete=true...');
  const result = await prisma.user.updateMany({
    where: { profileSetupComplete: false },
    data: { profileSetupComplete: true },
  });
  console.log(`✅ Updated ${result.count} users to profileSetupComplete=true\n`);

  // Summary
  const finalUsers = await prisma.user.findMany();
  console.log('='.repeat(50));
  console.log('🎉 Database fix complete!');
  console.log(`👤 Total users: ${finalUsers.length}`);
  console.log('='.repeat(50));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Fix failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
