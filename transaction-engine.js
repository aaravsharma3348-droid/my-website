const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: String, unique: true, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  fundName: { type: String, required: true },
  amount: { type: Number, required: true },
  units: { type: Number },
  nav: { type: Number },
  status: { type: String, enum: ['CREATED', 'PROCESSING', 'SUCCESS', 'FAILED'], default: 'CREATED' },
  isSIP: { type: Boolean, default: false },
  sipDate: { type: Number }, // Day of month for SIP
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
});

const Order = mongoose.model('Order', orderSchema);

// SIP Schema
const sipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fundName: { type: String, required: true },
  amount: { type: Number, required: true },
  sipDate: { type: Number, required: true }, // Day of month
  status: { type: String, enum: ['ACTIVE', 'PAUSED', 'CANCELLED'], default: 'ACTIVE' },
  nextExecutionDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SIP = mongoose.model('SIP', sipSchema);

// Portfolio Schema
const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fundName: { type: String, required: true },
  totalUnits: { type: Number, default: 0 },
  totalInvested: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

// Generate Order ID
function generateOrderId() {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Get NAV (Mock function - replace with real NAV API)
function getCurrentNAV(fundName) {
  const navData = {
    'SBI Bluechip Fund': 45.67,
    'HDFC Mid Cap Fund': 58.32,
    'Axis Small Cap Fund': 42.15
  };
  return navData[fundName] || 50.00;
}

// Buy Mutual Fund API
async function buyMutualFund(req, res) {
  try {
    const { fundName, amount, isSIP, sipDate } = req.body;
    const userId = req.user.userId;
    
    const orderId = generateOrderId();
    const nav = getCurrentNAV(fundName);
    const units = amount / nav;
    
    const order = new Order({
      userId,
      orderId,
      type: 'BUY',
      fundName,
      amount,
      units,
      nav,
      isSIP,
      sipDate
    });
    
    await order.save();
    
    // Process order immediately
    processOrder(orderId);
    
    res.json({
      success: true,
      orderId,
      message: 'Buy order created successfully',
      units: units.toFixed(4)
    });
    
  } catch (error) {
    res.json({ success: false, message: 'Failed to create buy order' });
  }
}

// Sell Mutual Fund API
async function sellMutualFund(req, res) {
  try {
    const { fundName, units } = req.body;
    const userId = req.user.userId;
    
    // Check if user has enough units
    const portfolio = await Portfolio.findOne({ userId, fundName });
    if (!portfolio || portfolio.totalUnits < units) {
      return res.json({ success: false, message: 'Insufficient units' });
    }
    
    const orderId = generateOrderId();
    const nav = getCurrentNAV(fundName);
    const amount = units * nav;
    
    const order = new Order({
      userId,
      orderId,
      type: 'SELL',
      fundName,
      amount,
      units,
      nav
    });
    
    await order.save();
    
    // Process order immediately
    processOrder(orderId);
    
    res.json({
      success: true,
      orderId,
      message: 'Sell order created successfully',
      amount: amount.toFixed(2)
    });
    
  } catch (error) {
    res.json({ success: false, message: 'Failed to create sell order' });
  }
}

// Process Order
async function processOrder(orderId) {
  try {
    const order = await Order.findOne({ orderId });
    if (!order) return;
    
    // Update status to PROCESSING
    order.status = 'PROCESSING';
    await order.save();
    
    // Simulate processing delay
    setTimeout(async () => {
      try {
        if (order.type === 'BUY') {
          await processBuyOrder(order);
        } else {
          await processSellOrder(order);
        }
        
        // Create SIP if needed
        if (order.isSIP && order.type === 'BUY') {
          await createSIP(order);
        }
        
        order.status = 'SUCCESS';
        order.processedAt = new Date();
        await order.save();
        
      } catch (error) {
        order.status = 'FAILED';
        await order.save();
      }
    }, 2000);
    
  } catch (error) {
    console.error('Order processing error:', error);
  }
}

// Process Buy Order
async function processBuyOrder(order) {
  let portfolio = await Portfolio.findOne({ 
    userId: order.userId, 
    fundName: order.fundName 
  });
  
  if (!portfolio) {
    portfolio = new Portfolio({
      userId: order.userId,
      fundName: order.fundName,
      totalUnits: 0,
      totalInvested: 0
    });
  }
  
  portfolio.totalUnits += order.units;
  portfolio.totalInvested += order.amount;
  portfolio.currentValue = portfolio.totalUnits * order.nav;
  portfolio.lastUpdated = new Date();
  
  await portfolio.save();
}

// Process Sell Order
async function processSellOrder(order) {
  const portfolio = await Portfolio.findOne({ 
    userId: order.userId, 
    fundName: order.fundName 
  });
  
  if (portfolio) {
    portfolio.totalUnits -= order.units;
    portfolio.totalInvested -= (order.amount / order.nav) * (portfolio.totalInvested / portfolio.totalUnits);
    portfolio.currentValue = portfolio.totalUnits * order.nav;
    portfolio.lastUpdated = new Date();
    
    await portfolio.save();
  }
}

// Create SIP
async function createSIP(order) {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(order.sipDate);
  
  const sip = new SIP({
    userId: order.userId,
    fundName: order.fundName,
    amount: order.amount,
    sipDate: order.sipDate,
    nextExecutionDate: nextMonth
  });
  
  await sip.save();
}

// SIP Scheduler - Runs daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running SIP scheduler...');
  
  const today = new Date();
  const sips = await SIP.find({
    status: 'ACTIVE',
    nextExecutionDate: { $lte: today }
  });
  
  for (const sip of sips) {
    try {
      const orderId = generateOrderId();
      const nav = getCurrentNAV(sip.fundName);
      const units = sip.amount / nav;
      
      const order = new Order({
        userId: sip.userId,
        orderId,
        type: 'BUY',
        fundName: sip.fundName,
        amount: sip.amount,
        units,
        nav,
        isSIP: true
      });
      
      await order.save();
      processOrder(orderId);
      
      // Update next execution date
      const nextMonth = new Date(sip.nextExecutionDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      sip.nextExecutionDate = nextMonth;
      await sip.save();
      
      console.log(`SIP executed for user ${sip.userId}, fund ${sip.fundName}`);
      
    } catch (error) {
      console.error('SIP execution error:', error);
    }
  }
});

// Get Order Status API
async function getOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }
    
    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        type: order.type,
        fundName: order.fundName,
        amount: order.amount,
        units: order.units,
        status: order.status,
        createdAt: order.createdAt,
        processedAt: order.processedAt
      }
    });
    
  } catch (error) {
    res.json({ success: false, message: 'Failed to get order status' });
  }
}

// Get Portfolio API
async function getPortfolio(req, res) {
  try {
    const userId = req.user.userId;
    const portfolio = await Portfolio.find({ userId });
    
    res.json({
      success: true,
      portfolio
    });
    
  } catch (error) {
    res.json({ success: false, message: 'Failed to get portfolio' });
  }
}

module.exports = {
  Order,
  SIP,
  Portfolio,
  buyMutualFund,
  sellMutualFund,
  getOrderStatus,
  getPortfolio
};