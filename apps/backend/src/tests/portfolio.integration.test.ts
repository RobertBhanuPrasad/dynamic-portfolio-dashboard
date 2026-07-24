import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

test('Portfolio Module Integration', async (t) => {
  let createdPortfolioId: string;

  await t.test('1. Get portfolio list', async () => {
    // DO NOT wipe the database here as it runs against development DB
    const response = await request(app).get('/api/v1/portfolios');
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.body.data));
  });

  await t.test('2. Invalid portfolio UUID format', async () => {
    const response = await request(app).get('/api/v1/portfolios/not-a-uuid');
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.error.code, 'VALIDATION_ERROR');
  });

  await t.test('3. Portfolio not found (valid UUID)', async () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const response = await request(app).get(`/api/v1/portfolios/${validUuid}`);
    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.body.error.code, 'NOT_FOUND');
  });

  await t.test('4. Successful response with test data & Decimal serialization', async () => {
    // Insert test data
    const user = await prisma.user.create({
      data: { email: 'test@example.com' }
    });

    const portfolio = await prisma.portfolio.create({
      data: { userId: user.id, name: 'Test Portfolio' }
    });
    createdPortfolioId = portfolio.id;

    const sector = await prisma.sector.create({
      data: { name: 'Technology Test' }
    });

    await prisma.holding.create({
      data: {
        portfolioId: portfolio.id,
        sectorId: sector.id,
        ticker: 'TEST',
        companyName: 'Test Corp',
        quantity: 100.5,
        purchasePrice: 50.25
      }
    });

    // Test specific portfolio endpoint
    const response = await request(app).get(`/api/v1/portfolios/${portfolio.id}`);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.data.name, 'Test Portfolio');
    
    // Check calculations structure
    assert.strictEqual(response.body.data.sectors.length, 1);
    
    // Assert Decimal serialization works correctly (should be numbers, not objects)
    const holding = response.body.data.sectors[0].holdings[0];
    assert.strictEqual(holding.quantity, 100.5);
    assert.strictEqual(typeof holding.quantity, 'number');
    assert.strictEqual(holding.purchasePrice, 50.25);
    assert.strictEqual(typeof holding.purchasePrice, 'number');
    assert.strictEqual(holding.sector.name, 'Technology Test');
    
    // Verify pure calculations
    assert.strictEqual(holding.investment, 5050.13); // 100.5 * 50.25 = 5050.125 rounded to 5050.13
    assert.strictEqual(response.body.data.summary.totalInvestment, 5050.13);
  });

  await t.test('5. Cleanup temporary test data', async () => {
    // Only delete the specific records created by this test!
    if (createdPortfolioId) {
      await prisma.holding.deleteMany({ where: { portfolioId: createdPortfolioId } });
      await prisma.portfolio.delete({ where: { id: createdPortfolioId } });
    }
    await prisma.sector.deleteMany({ where: { name: 'Technology Test' } });
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await prisma.$disconnect();
  });
});
