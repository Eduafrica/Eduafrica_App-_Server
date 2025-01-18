import InstructorModel from "../models/Instructors.js";
import OrganizationModel from "../models/Organization.js";
import StudentModel from "../models/Student.js";
import OrderModel from "../models/Orders.js";
import WalletModel from "../models/Wallet.js";

const timePeriods = {
  today: 1,
  '7days': 7,
  '30days': 30,
  '3mth': 90,
  '6mth': 180,
  '1year': 365,
  alltime: null,
};

export async function getDashboardStats(req, res) {
  const { stats } = req.params;
  const period = timePeriods[stats];

  if (period === undefined) {
    return res.status(400).json({ success: false, message: 'Invalid stats period' });
  }

  try {
    const currentDate = new Date();
    const startDate = period ? new Date(currentDate.getTime() - period * 24 * 60 * 60 * 1000) : null;
    const previousStartDate = period ? new Date(startDate.getTime() - period * 24 * 60 * 60 * 1000) : null;

    const filterCurrent = period ? { createdAt: { $gte: startDate } } : {};
    const filterPrevious = period ? { createdAt: { $gte: previousStartDate, $lt: startDate } } : {};

    const [currentStudents, previousStudents] = await Promise.all([
      StudentModel.countDocuments(filterCurrent),
      StudentModel.countDocuments(filterPrevious)
    ]);

    const [currentInstructors, previousInstructors] = await Promise.all([
      InstructorModel.countDocuments(filterCurrent),
      InstructorModel.countDocuments(filterPrevious)
    ]);

    const [currentOrganizations, previousOrganizations] = await Promise.all([
      OrganizationModel.countDocuments(filterCurrent),
      OrganizationModel.countDocuments(filterPrevious)
    ]);

    const currentOrdersCount = await OrderModel.countDocuments({ 
      ...filterCurrent, 
      paid: true, 
      orderStatus: 'Successful' 
    });
    const previousOrdersCount = await OrderModel.countDocuments({ 
      ...filterPrevious, 
      paid: true, 
      orderStatus: 'Successful' 
    });

    const currentRevenue = await WalletModel.aggregate([
      { $match: filterCurrent },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);
    const previousRevenue = await WalletModel.aggregate([
      { $match: filterPrevious },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);

    const calculateStats = (current, previous) => {
      const difference = current - previous;
      const percentChange = previous ? ((difference / previous) * 100).toFixed(2) : 0;
      const slug = difference >= 0 ? 'positive' : 'negative';
      return { total: current, percent: Math.abs(percentChange), slug };
    };

    const studentStats = calculateStats(currentStudents, previousStudents);
    const instructorStats = calculateStats(currentInstructors, previousInstructors);
    const organizationStats = calculateStats(currentOrganizations, previousOrganizations);
    const ordersStats = calculateStats(currentOrdersCount, previousOrdersCount);
    const revenueStats = calculateStats(
      currentRevenue[0]?.totalAmount || 0, 
      previousRevenue[0]?.totalAmount || 0
    );

    const statsData = [
      {
        id: 'revenue',
        title: 'Total Revenue',
        ...revenueStats
      },
      {
        id: 'orders',
        title: 'Total Orders',
        ...ordersStats
      },
      {
        id: 'averageOrderValue',
        title: 'Avg. order value',
        total: 91.42,
        percent: 2,
        slug: 'negative'
      },
      {
        id: 'students',
        title: 'Total Students',
        ...studentStats
      },
      {
        id: 'instructors',
        title: 'Total Instructors',
        ...instructorStats
      },
      {
        id: 'organizations',
        title: 'Total Organizations',
        ...organizationStats
      }
    ];

    res.status(200).json({ success: true, data: statsData });
  } catch (error) {
    console.error('UNABLE TO GET DASHBOARD STATS', error);
    res.status(500).json({ success: false, message: 'Unable to get dashboard stats' });
  }
}
