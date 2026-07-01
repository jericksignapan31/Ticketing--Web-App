import { AppDataSource } from './src/data-source';

async function checkAssets() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    console.log('\n📦 Asset Database Status:\n');

    const assets = await AppDataSource.query('SELECT COUNT(*) FROM asset');
    console.log(`Total Assets: ${assets[0].count}`);

    const brands = await AppDataSource.query('SELECT COUNT(*) FROM brand');
    console.log(`Total Brands: ${brands[0].count}`);

    if (assets[0].count > 0) {
      const assetList = await AppDataSource.query(`
        SELECT a.asset_id, a.asset_tag, a.category, a.model, a.status 
        FROM asset a 
        LIMIT 10
      `);
      
      console.log('\n📝 Sample Assets:');
      assetList.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.asset_tag} (${a.category}) - ${a.model} [${a.status}]`);
      });
    } else {
      console.log('❌ No assets found');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAssets();
