import { Router } from 'express';
import { dashboard } from '../data/platformData.js';
import { trading } from '../data/operationalData.js';
import { requireRole } from '../auth/middleware.js';
import { readNumber, readText, requireOneOf } from '../http/validation.js';
import { persistRuntimeSections } from '../data/runtimeStore.js';

const router = Router();
const SAFE_RESERVE_RATE = 0.08;
const SELL_ORDER_TYPES = ['Limit satış', 'Spot satış'];
const ORDER_TYPES = [...SELL_ORDER_TYPES, 'Alış emri'];

function tradingCapacity() {
  const safeReserve = Math.round(dashboard.summary.quotaLimit * SAFE_RESERVE_RATE);
  const reservedByOpenOrders = trading.orders
    .filter((order) => SELL_ORDER_TYPES.includes(order.type) && ['Beklemede', 'Açık'].includes(order.status))
    .reduce((sum, order) => sum + Number(order.amount || 0), 0);
  return {
    safeReserve,
    reservedByOpenOrders,
    availableCapacity: Math.max(0, dashboard.summary.sellableSurplus - safeReserve - reservedByOpenOrders),
  };
}

router.get('/', (_req, res) => res.json({ ...trading, ...tradingCapacity() }));
router.post('/orders', requireRole('admin'), (req, res) => {
  const amount = readNumber(req.body?.amount, 'Emir miktarı', { min: 0.001, max: 1_000_000 });
  const price = readNumber(req.body?.price, 'Birim fiyat', { min: 0.01, max: 1_000_000 });
  const type = requireOneOf(
    readText(req.body?.type, 'Emir türü', { defaultValue: 'Limit satış', maxLength: 30 }),
    'Emir türü',
    ORDER_TYPES
  );
  const capacity = tradingCapacity();
  if (SELL_ORDER_TYPES.includes(type) && amount > capacity.availableCapacity) {
    return res.status(400).json({ message: 'Emir miktarı satılabilir kotaya uygun değil.' });
  }
  const order = {
    id: `ORD-${Date.now()}`,
    type,
    amount,
    price,
    status: 'Beklemede',
  };
  trading.orders.unshift(order);
  persistRuntimeSections({ trading });
  return res.status(201).json({ ...order, capacity: tradingCapacity() });
});

export default router;
