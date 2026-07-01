import { AppDataSource } from './src/data-source';
import { v4 as uuidv4 } from 'uuid';

async function restoreBrands() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    console.log('\n🔄 Creating IT-related brands...\n');

    // Comprehensive IT brands
    const brands = [
      // Monitors
      { name: 'Dell', description: 'Dell Computers & Displays' },
      { name: 'HP', description: 'Hewlett Packard' },
      { name: 'LG', description: 'LG Electronics' },
      { name: 'ASUS', description: 'ASUS Computers & Peripherals' },
      { name: 'BenQ', description: 'BenQ Displays & Peripherals' },
      { name: 'ViewSonic', description: 'ViewSonic Displays' },
      { name: 'Acer', description: 'Acer Computers & Displays' },
      
      // CPUs/Processors
      { name: 'Intel', description: 'Intel Processors' },
      { name: 'AMD', description: 'AMD Processors' },
      { name: 'Apple', description: 'Apple Computers & Chips' },
      
      // Printers
      { name: 'Canon', description: 'Canon Printers & Imaging' },
      { name: 'Xerox', description: 'Xerox Printers & Copiers' },
      { name: 'Brother', description: 'Brother Printers' },
      { name: 'Epson', description: 'Epson Printers' },
      { name: 'Ricoh', description: 'Ricoh Printers & Copiers' },
      
      // CCTV & Security
      { name: 'Hikvision', description: 'Hikvision CCTV Systems' },
      { name: 'Dahua', description: 'Dahua CCTV Systems' },
      { name: 'Uniview', description: 'Uniview CCTV Systems' },
      { name: 'Axis Communications', description: 'Axis Network Cameras' },
      { name: 'Bosch', description: 'Bosch Security Systems' },
      
      // Networking Equipment
      { name: 'Cisco', description: 'Cisco Networking' },
      { name: 'Ubiquiti', description: 'Ubiquiti Networks' },
      { name: 'TP-Link', description: 'TP-Link Networking' },
      { name: 'Netgear', description: 'Netgear Networking' },
      { name: 'Fortinet', description: 'Fortinet Security' },
      { name: 'Juniper', description: 'Juniper Networks' },
      { name: 'D-Link', description: 'D-Link Networking' },
      
      // Storage & Hard Drives
      { name: 'Western Digital', description: 'WD Storage Solutions' },
      { name: 'Seagate', description: 'Seagate Storage & Drives' },
      { name: 'Samsung', description: 'Samsung Storage & SSDs' },
      { name: 'Kingston', description: 'Kingston Memory & Storage' },
      { name: 'Crucial', description: 'Crucial Memory & Storage' },
      
      // Power Supply & UPS
      { name: 'APC', description: 'APC Power & UPS Systems' },
      { name: 'Corsair', description: 'Corsair Power Supplies' },
      { name: 'Seasonic', description: 'Seasonic Power Supplies' },
      { name: 'Eaton', description: 'Eaton Power Solutions' },
      
      // Keyboards & Mice
      { name: 'Logitech', description: 'Logitech Peripherals' },
      { name: 'Razer', description: 'Razer Gaming Peripherals' },
      { name: 'SteelSeries', description: 'SteelSeries Gaming Gear' },
      { name: 'Corsair', description: 'Corsair Gaming & PC Hardware' },
      { name: 'Microsoft', description: 'Microsoft Peripherals & Software' },
      
      // Servers
      { name: 'Lenovo', description: 'Lenovo Servers & Computers' },
      { name: 'IBM', description: 'IBM Enterprise Solutions' },
      
      // Cables & Accessories
      { name: 'Belkin', description: 'Belkin Cables & Accessories' },
      { name: 'Tripp Lite', description: 'Tripp Lite Power & Cables' },
      { name: 'StarTech', description: 'StarTech Cables & Adapters' },
      
      // Software/Licenses
      { name: 'Adobe', description: 'Adobe Software' },
      { name: 'Microsoft', description: 'Microsoft Software' },
      { name: 'Autodesk', description: 'Autodesk Software' },
    ];

    // Remove duplicates by name
    const uniqueBrands = Array.from(
      new Map(brands.map(b => [b.name, b])).values()
    );

    let count = 0;
    for (const brand of uniqueBrands) {
      try {
        await AppDataSource.query(
          `INSERT INTO brand (brand_id, brand_name, description, created_at, updated_at) 
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [uuidv4(), brand.name, brand.description]
        );
        console.log(`✅ ${brand.name}`);
        count++;
      } catch (error) {
        console.log(`⚠️  ${brand.name} - Already exists`);
      }
    }

    const totalBrands = await AppDataSource.query('SELECT COUNT(*) FROM brand');
    console.log(`\n✅ Total brands in database: ${totalBrands[0].count}`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

restoreBrands();
