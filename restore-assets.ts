import { AppDataSource } from './src/data-source';
import { v4 as uuidv4 } from 'uuid';

async function restoreAssets() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    console.log('\n🔄 Restoring assets and brands...\n');

    // Get branches
    const branches = await AppDataSource.query('SELECT branch_id FROM branch');
    if (branches.length === 0) {
      console.log('❌ No branches found');
      await AppDataSource.destroy();
      return;
    }

    // Create brands
    const brands = [
      { name: 'Dell', description: 'Dell Computers' },
      { name: 'HP', description: 'Hewlett Packard' },
      { name: 'Lenovo', description: 'Lenovo Computers' },
      { name: 'Canon', description: 'Canon Printers' },
      { name: 'Cisco', description: 'Cisco Networking' },
    ];

    const brandIds: any[] = [];
    for (const brand of brands) {
      const result = await AppDataSource.query(
        `INSERT INTO brand (brand_id, brand_name, description) VALUES ($1, $2, $3) RETURNING brand_id`,
        [uuidv4(), brand.name, brand.description]
      );
      brandIds.push({ ...brand, id: result[0].brand_id });
      console.log(`✅ Brand created: ${brand.name}`);
    }

    // Create sample assets
    const assets = [
      { tag: 'LAP-001', category: 'laptop', model: 'Dell XPS 13', brand: 'Dell' },
      { tag: 'LAP-002', category: 'laptop', model: 'HP Pavilion 15', brand: 'HP' },
      { tag: 'LAP-003', category: 'laptop', model: 'Lenovo ThinkPad', brand: 'Lenovo' },
      { tag: 'DES-001', category: 'desktop', model: 'Dell OptiPlex 5090', brand: 'Dell' },
      { tag: 'DES-002', category: 'desktop', model: 'HP Envy Desktop', brand: 'HP' },
      { tag: 'MON-001', category: 'monitor', model: 'Dell U2415', brand: 'Dell' },
      { tag: 'MON-002', category: 'monitor', model: 'HP Z27', brand: 'HP' },
      { tag: 'PRN-001', category: 'printer', model: 'Canon imageCLASS', brand: 'Canon' },
      { tag: 'PRN-002', category: 'printer', model: 'HP LaserJet Pro', brand: 'HP' },
      { tag: 'NET-001', category: 'networking', model: 'Cisco Switch 2960', brand: 'Cisco' },
      { tag: 'KBD-001', category: 'keyboard', model: 'Logitech MX Keys', brand: 'Lenovo' },
      { tag: 'MOU-001', category: 'mouse', model: 'Logitech MX Master 3', brand: 'Dell' },
    ];

    let assetCount = 0;
    const branchId = branches[0].branch_id;

    for (const asset of assets) {
      const brandRecord = brandIds.find(b => b.name === asset.brand);
      if (!brandRecord) continue;

      await AppDataSource.query(
        `INSERT INTO asset (asset_id, asset_tag, brand_id, branch_id, category, model, status, condition, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [uuidv4(), asset.tag, brandRecord.id, branchId, asset.category, asset.model, 'available', 'good']
      );
      console.log(`✅ Asset created: ${asset.tag} (${asset.model})`);
      assetCount++;
    }

    console.log(`\n✅ Total assets restored: ${assetCount}`);
    console.log(`✅ Total brands created: ${brandIds.length}\n`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

restoreAssets();
